import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const audio = form.get("file") as File;

        if (!audio) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const arrayBuffer = await audio.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 2.5 Flash for STT as requested/consistent
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "audio/mp3",
                    data: base64Audio
                }
            },
            { text: "Transcribe this audio exactly as spoken." }
        ]);

        const text = result.response.text();

        return NextResponse.json({ text: text });
    } catch (error: any) {
        console.error("STT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
