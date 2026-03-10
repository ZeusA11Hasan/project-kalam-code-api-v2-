
// 2. LLM Abstraction Layer
// Responsibilities: Switch between Gemini and Sarvam based on ENV

import { chatWithSarvam, chatWithSarvamStream } from "./sarvamClient";
import { generateContentGemini } from "@/lib/gemini-raw";
import { GEMINI_MODELS } from "@/lib/gemini-constants";

export async function callLLM(
    prompt: string,
    config: {
        apiKey?: string,
        systemInstruction?: string,
        geminiModel?: string,
        stream?: boolean
    }
): Promise<string | ReadableStream<Uint8Array>> {
    // 1. Determine Strategy
    // Unset or 'gemini' => Gemini Primary + Sarvam Fallback
    // 'sarvam' => Force Sarvam
    const provider = process.env.LLM_PROVIDER || "gemini"; // 🔒 Default: GEMINI PRIORITY
    let useSarvam = provider === "sarvam";

    if (!useSarvam) {
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
            // Throw error to see Gemini issues directly
            throw error;
        }
    }

    // SARVAM (Fallback or Forced)
    if (useSarvam) {
        const messages = [{ role: "user" as const, content: prompt }];
        const systemPrompt = config.systemInstruction || "";

        if (config.stream) {
            return chatWithSarvamStream(messages, systemPrompt);
        }

        return chatWithSarvam(messages, systemPrompt);
    }

    throw new Error("Unexpected LLM failure: No provider available.");
}
