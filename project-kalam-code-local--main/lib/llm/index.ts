
// 2. LLM Abstraction Layer
// Responsibilities: Switch between Gemini and Ollama based on ENV

import { callOllama, callOllamaStream } from "./ollamaClient";
import { generateContentGemini } from "@/lib/gemini-raw";
import { GEMINI_MODELS } from "@/lib/gemini-constants";

export async function callLLM(
    prompt: string,
    config: {
        apiKey?: string,
        systemInstruction?: string,
        geminiModel?: string,
        ollamaModel?: string,
        stream?: boolean
    }
): Promise<string | ReadableStream<Uint8Array>> {
    // 1. Determine Strategy
    // Unset or 'gemini' => Gemini Primary + Ollama Fallback
    // 'ollama' => Force Ollama
    // const provider = process.env.LLM_PROVIDER || "gemini";
    const provider = "gemini"; // 🔒 FORCE GEMINI PRIORITY
    let useOllama = provider === "ollama";

    if (!useOllama) {
        // TRY GEMINI
        try {
            console.log(`[LLM] Attempting Gemini (Model: ${config.geminiModel || GEMINI_MODELS.FAST})...`);

            if (!config.apiKey) {
                throw new Error("Gemini API Key missing.");
            }

            return await generateContentGemini(
                config.apiKey,
                config.geminiModel || GEMINI_MODELS.FAST,
                config.systemInstruction || "",
                prompt
            );

        } catch (error: any) {
            console.warn(`⚠️ [LLM] Gemini Failed: ${error.message}`);
            // console.warn(`🔄 [LLM] Falling back to Ollama...`);
            // useOllama = true; // Trigger fallback -> DISABLED TEMPORARILY
            // Throw error to see Gemini issues directly
            throw error;
        }
    }

    // OLLAMA (Fallback or Forced)
    if (useOllama) {
        const finalPrompt = config.systemInstruction
            ? `${config.systemInstruction}\n\n${prompt}`
            : prompt;

        // Note: User requested "NON-STREAMING initially" for stability in fallback too.
        // But keeping the capability if config asks for it is good practice, 
        // however for this specific refactor I will strictly follow "Ollama uses: stream: false" from requirements.

        return callOllama(finalPrompt, config.ollamaModel || "phi3:mini");
    }

    throw new Error("Unexpected LLM failure: No provider available.");
}
