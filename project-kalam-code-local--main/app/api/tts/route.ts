import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const { text } = json;

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
                responseModalities: ["AUDIO"]
            } as any
        } as any);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: text }] }]
        });

        const response = await result.response;

        // Check for inline data (audio)
        const candidates = response.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts.length > 0) {
            const part = candidates[0].content.parts[0];
            if (part.inlineData && part.inlineData.data) {
                const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
                return new Response(new Uint8Array(audioBuffer), {
                    headers: { "Content-Type": "audio/mp3" },
                });
            }
        }

        // Fallback log
        try {
            const textOutput = response.text();
            console.log("TTS Text Output debug:", textOutput);
        } catch (e) { }

        return NextResponse.json({ error: "No audio generated from Gemini TTS model" }, { status: 500 });

    } catch (error: any) {
        console.error("TTS Error:", error);
        try {
            const fs = require('fs');
            fs.writeFileSync('tts_error.txt', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) { }
        return NextResponse.json({ error: "TTS generation failed: " + error.message }, { status: 500 });
    }
}
