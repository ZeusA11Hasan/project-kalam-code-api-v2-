import { Tables } from "@/supabase/types"
import { ChatPayload, MessageImage } from "@/types"
import { encode } from "gpt-tokenizer"
import { getBase64FromDataURL, getMediaTypeFromDataURL } from "@/lib/utils"

const WHITEBOARD_CONTROLLER_PROMPT = `
You are a Whiteboard Rendering Controller for a STEM educational AI tutor.

THIS SYSTEM HAS TWO OUTPUT SURFACES:
1) WHITEBOARD (render-only)
2) CHAT (text-only)

CRITICAL ROUTING RULE:
- Any structured output you produce MUST be rendered on the WHITEBOARD.
- Structured output MUST NEVER appear in the CHAT.
- The CHAT must remain empty whenever WHITEBOARD rendering is triggered.

==================================================
ABSOLUTE RULES (NON-NEGOTIABLE)
==================================================
1. You NEVER draw or describe visuals.
2. You NEVER output ASCII art, SVG, or diagrams.
3. You NEVER explain in paragraphs when rendering is required.
4. You ONLY output structured JSON for WHITEBOARD rendering.
5. You assume the frontend ALREADY KNOWS how to render all supported formats.
6. You MUST match the renderer’s expected input format exactly.

==================================================
RENDERER CAPABILITIES YOU MUST USE
==================================================

----------------------------------
1) MATH & PHYSICS (KaTeX)
----------------------------------
- Use KaTeX-compatible LaTeX only.
- Do NOT rely on full LaTeX packages.
- You MAY use the following supported macros:

Physics-style macros:
- Vectors: \\va, \\vF, \\vB, \\grad, \\div, \\curl
- Derivatives: \\dv{x}{t}, \\pdv{f}{x}, \\dd

SI units:
- \\unit{kg}, \\si{m/s}, \\ohm

Symbols:
- \\RR, \\NN, \\ZZ, \\CC
- \\implies, \\iff

----------------------------------
2) CHEMISTRY (RDKit – SMILES ONLY)
----------------------------------
- All chemical structures MUST be provided as SMILES strings.
- Benzene MUST be provided as: c1ccccc1
- Aromatic compounds MUST preserve aromatic notation.
- NEVER use shortcuts like C6H5 or ASCII structures.
- RDKit will generate the 2D structure.

----------------------------------
3) GRAPHS & CHARTS (Recharts)
----------------------------------
Supported chart types:
- line, bar, pie, area

Math Mode:
- Functions may be provided as strings (e.g., "sin(x) + x^2")
- Domain must be specified
- Renderer will auto-generate data points

Smart features available:
- Symbolic π axis labeling
- Area shading between limits

----------------------------------
4) TABLES
----------------------------------
- Structured rows and columns only
- No markdown tables
- Headers optional

==================================================
YOUR JOB
==================================================
- Detect whether the user request requires WHITEBOARD rendering.
- If YES:
  - Output ONLY a valid JSON render instruction.
  - Route it to the WHITEBOARD.
  - Do NOT output chat text.
- If NO:
  - Respond normally in CHAT.
  - Do NOT output JSON.

==================================================
SUPPORTED RENDER TYPES
==================================================
- math
- physics
- chemistry
- graph
- table

==================================================
RENDER SCHEMAS
==================================================

-------------------------
MATH
-------------------------
{
  "render": "math",
  "content": {
    "topic": "",
    "latex": [],
    "steps": [],
    "final_answer": ""
  }
}

-------------------------
PHYSICS
-------------------------
{
  "render": "physics",
  "content": {
    "topic": "",
    "law": "",
    "latex": [],
    "given": {},
    "solution_steps": [],
    "final_answer": ""
  }
}

-------------------------
CHEMISTRY (STRUCTURAL)
-------------------------
{
  "render": "chemistry",
  "content": {
    "reaction_name": "",
    "reactants": [
      { "name": "", "smiles": "" }
    ],
    "reagents": [],
    "conditions": "",
    "products": [
      { "name": "", "smiles": "" }
    ]
  }
}

-------------------------
GRAPH
-------------------------
{
  "render": "graph",
  "content": {
    "chart_type": "line | bar | pie | area",
    "math_function": "",
    "domain": [0, 0],
    "shade_between": [null, null],
    "x_label": "",
    "y_label": ""
  }
}

-------------------------
TABLE
-------------------------
{
  "render": "table",
  "content": {
    "headers": [],
    "rows": []
  }
}

==================================================
STRICT OUTPUT RULES
==================================================
- Output ONLY valid JSON when rendering
- No markdown
- No comments
- No extra keys
- No text before or after JSON
- JSON MUST be routed to WHITEBOARD ONLY

If the request is ambiguous:
- Ask ONE clarification question in CHAT
- Do NOT output JSON
`

const buildBasePrompt = (
  prompt: string,
  profileContext: string,
  workspaceInstructions: string,
  assistant: Tables<"assistants"> | null
) => {
  let fullPrompt = ""

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`
  }

  fullPrompt += `Whiteboard Controller Instructions:\n${WHITEBOARD_CONTROLLER_PROMPT}\n\n`

  fullPrompt += `User Instructions:\n${prompt}`

  return fullPrompt
}

export async function buildFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  chatImages: MessageImage[]
) {
  const {
    chatSettings,
    workspaceInstructions,
    chatMessages,
    assistant,
    messageFileItems,
    chatFileItems
  } = payload

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || "" : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )

  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS

  let usedTokens = 0
  usedTokens += PROMPT_TOKENS

  const processedChatMessages = chatMessages.map((chatMessage, index) => {
    const nextChatMessage = chatMessages[index + 1]

    if (nextChatMessage === undefined) {
      return chatMessage
    }

    const nextChatMessageFileItems = nextChatMessage.fileItems

    if (nextChatMessageFileItems.length > 0) {
      const findFileItems = nextChatMessageFileItems
        .map(fileItemId =>
          chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId)
        )
        .filter(item => item !== undefined) as Tables<"file_items">[]

      const retrievalText = buildRetrievalText(findFileItems)

      return {
        message: {
          ...chatMessage.message,
          content:
            `${chatMessage.message.content}\n\n${retrievalText}` as string
        },
        fileItems: []
      }
    }

    return chatMessage
  })

  let finalMessages = []

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens
      usedTokens += messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: processedChatMessages.length + "",
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: processedChatMessages.length,
    updated_at: "",
    user_id: ""
  }

  finalMessages.unshift(tempSystemMessage)

  finalMessages = finalMessages.map(message => {
    let content

    if (message.image_paths.length > 0) {
      content = [
        {
          type: "text",
          text: message.content
        },
        ...message.image_paths.map(path => {
          let formedUrl = ""

          if (path.startsWith("data")) {
            formedUrl = path
          } else {
            const chatImage = chatImages.find(image => image.path === path)

            if (chatImage) {
              formedUrl = chatImage.base64
            }
          }

          return {
            type: "image_url",
            image_url: {
              url: formedUrl
            }
          }
        })
      ]
    } else {
      content = message.content
    }

    return {
      role: message.role,
      content
    }
  })

  if (messageFileItems.length > 0) {
    const retrievalText = buildRetrievalText(messageFileItems)

    finalMessages[finalMessages.length - 1] = {
      ...finalMessages[finalMessages.length - 1],
      content: `${finalMessages[finalMessages.length - 1].content
        }\n\n${retrievalText}`
    }
  }

  return finalMessages
}

function buildRetrievalText(fileItems: Tables<"file_items">[]) {
  const retrievalText = fileItems
    .map(item => `<BEGIN SOURCE>\n${item.content}\n</END SOURCE>`)
    .join("\n\n")

  return `You may use the following sources if needed to answer the user's question. If you don't know the answer, say "I don't know."\n\n${retrievalText}`
}

function adaptSingleMessageForGoogleGemini(message: any) {

  let adaptedParts = []

  let rawParts = []
  if (!Array.isArray(message.content)) {
    rawParts.push({ type: 'text', text: message.content })
  } else {
    rawParts = message.content
  }

  for (let i = 0; i < rawParts.length; i++) {
    let rawPart = rawParts[i]

    if (rawPart.type == 'text') {
      adaptedParts.push({ text: rawPart.text })
    } else if (rawPart.type === 'image_url') {
      adaptedParts.push({
        inlineData: {
          data: getBase64FromDataURL(rawPart.image_url.url),
          mimeType: getMediaTypeFromDataURL(rawPart.image_url.url),
        }
      })
    }
  }

  let role = 'user'
  if (["user", "system"].includes(message.role)) {
    role = 'user'
  } else if (message.role === 'assistant') {
    role = 'model'
  }

  return {
    role: role,
    parts: adaptedParts
  }
}

function adaptMessagesForGeminiVision(
  messages: any[]
) {
  // Gemini Pro Vision cannot process multiple messages
  // Reformat, using all texts and last visual only

  const basePrompt = messages[0].parts[0].text
  const baseRole = messages[0].role
  const lastMessage = messages[messages.length - 1]
  const visualMessageParts = lastMessage.parts;
  let visualQueryMessages = [{
    role: "user",
    parts: [
      `${baseRole}:\n${basePrompt}\n\nuser:\n${visualMessageParts[0].text}\n\n`,
      visualMessageParts.slice(1)
    ]
  }]
  return visualQueryMessages
}

export async function adaptMessagesForGoogleGemini(
  payload: ChatPayload,
  messages: any[]
) {
  let geminiMessages = []
  for (let i = 0; i < messages.length; i++) {
    let adaptedMessage = adaptSingleMessageForGoogleGemini(messages[i])
    geminiMessages.push(adaptedMessage)
  }

  if (payload.chatSettings.model === "gemini-pro-vision") {
    geminiMessages = adaptMessagesForGeminiVision(geminiMessages)
  }
  return geminiMessages
}

