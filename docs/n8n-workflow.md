# n8n Workflow Configuration for AI Tutor

This document describes how to set up n8n as the backend orchestrator for the AI Tutor.

## Workflow Overview

```
User Input → Webhook → Enrich Prompt → Call AI Model → Parse Response → Return to Frontend
```

## n8n Webhook Endpoint

**URL**: `http://localhost:5678/webhook/ai-tutor`
**Method**: POST

### Request Payload

```json
{
  "messages": [
    {"role": "user", "content": "Explain the Pythagorean theorem"}
  ],
  "allow_whiteboard": true,
  "force_whiteboard": false,
  "mode": "tutor"
}
```

### Response Format

```json
{
  "text": "The Pythagorean theorem states that...",
  "latex": "$$a^2 + b^2 = c^2$$",
  "whiteboard_action": "draw",
  "commands": [
    {"type": "line", "from": [100, 400], "to": [400, 400]},
    {"type": "label", "text": "a² + b² = c²", "position": [200, 50]}
  ]
}
```

## n8n Workflow JSON

Import this into n8n:

```json
{
  "name": "AI Tutor Workflow",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-tutor",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "// Enrich prompt with system instructions\nconst input = items[0].json;\nconst mode = input.mode || 'tutor';\n\nconst systemPrompts = {\n  whiteboard: 'For drawing requests, output ONLY valid JSON array of commands.',\n  tutor: 'You are an AI Tutor for Indian students. Use LaTeX for math.'\n};\n\nconst enrichedMessages = [\n  { role: 'system', content: systemPrompts[mode] },\n  ...input.messages\n];\n\nreturn [{ json: { ...input, messages: enrichedMessages } }];"
      },
      "name": "Enrich Prompt",
      "type": "n8n-nodes-base.function",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.OPENAI_API_KEY}}"
        },
        "body": {
          "model": "gpt-4",
          "messages": "={{$node['Enrich Prompt'].json.messages}}"
        }
      },
      "name": "Call OpenAI",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "functionCode": "// Parse AI response\nconst response = items[0].json;\nconst content = response.choices[0].message.content;\n\nlet result = { text: content };\n\n// Check if response is JSON (whiteboard commands)\ntry {\n  const parsed = JSON.parse(content);\n  if (Array.isArray(parsed)) {\n    result = {\n      whiteboard_action: 'draw',\n      commands: parsed,\n      text: ''\n    };\n  }\n} catch (e) {\n  // Not JSON, keep as text\n}\n\nreturn [{ json: result }];"
      },
      "name": "Parse Response",
      "type": "n8n-nodes-base.function",
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$node['Parse Response'].json}}"
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Enrich Prompt", "type": "main", "index": 0 }]] },
    "Enrich Prompt": { "main": [[{ "node": "Call OpenAI", "type": "main", "index": 0 }]] },
    "Call OpenAI": { "main": [[{ "node": "Parse Response", "type": "main", "index": 0 }]] },
    "Parse Response": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  }
}
```

## Environment Variables

Set these in n8n:
- `OPENAI_API_KEY`: Your OpenAI API key

## Testing

```bash
curl -X POST http://localhost:5678/webhook/ai-tutor \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Draw a circle"}], "mode": "whiteboard"}'
```
