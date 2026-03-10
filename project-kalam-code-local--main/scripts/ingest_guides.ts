import path from 'path';
import fs from 'fs';
import { filesystemMcp } from '../lib/mcp/filesystem';
import { pdfParserMcp } from '../lib/mcp/pdf-parser';
import { ragDb } from '../lib/db/rag';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// --- CONFIG ---
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ Mising GOOGLE_API_KEY, GEMINI_API_KEY, or NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const GUIDE_DIR = path.resolve(process.cwd(), 'data/guide_pdfs');

// --- UTILS ---
function parseFilename(filename: string) {
    // Expected: "GuideName_Subject_Chapter.pdf" or generic
    const parts = filename.replace('.pdf', '').split('_');
    return {
        guideName: parts[0] || 'UnknownGuide',
        subject: parts.length > 1 ? parts[1] : 'General',
        chapter: parts.length > 2 ? parts.slice(2).join(' ') : filename
    };
}

// Stricter Chunking for Guides (250 tokens ~ 1000 chars, NO overlap)
function createGuideChunks(text: string, maxChars = 1000): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxChars;
        if (end > text.length) end = text.length;

        // Break at period to keep concepts whole
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            if (lastPeriod > start + maxChars * 0.7) { // Only backoff if feasible
                end = lastPeriod + 1;
            }
        }
        chunks.push(text.slice(start, end).trim());
        start = end; // NO overlap for guides
    }
    return chunks;
}

// --- MAIN ---
async function main() {
    console.log("🚀 Starting GUIDE PDF Ingestion (Priority 2)...");

    if (!fs.existsSync(GUIDE_DIR)) {
        console.error(`❌ Guide directory not found: ${GUIDE_DIR}`);
        console.log("👉 Please create 'data/guide_pdfs' and add PDFs.");
        process.exit(1);
    }

    const files = fs.readdirSync(GUIDE_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`found ${files.length} Guide PDFs`);

    for (const file of files) {
        console.log(`\n📘 Processing Guide: ${file}`);
        const meta = parseFilename(file);

        try {
            // Read & Parse
            const buffer = filesystemMcp.readPDF(`data/guide_pdfs/${file}`);
            const pages = await pdfParserMcp.parseLikelyStructure(buffer);
            console.log(`   parsed ${pages.length} pages`);

            let chunkCount = 0;
            for (const page of pages) {
                // Strict Chunking
                const textChunks = createGuideChunks(page.text);

                for (const chunkText of textChunks) {
                    if (chunkText.length < 50) continue;

                    // Embed
                    const result = await embeddingModel.embedContent(chunkText);
                    const vector = result.embedding.values;

                    // Store with Priority 2
                    ragDb.insertChunk({
                        content: chunkText,
                        embedding: vector,
                        source: `GUIDE:${meta.guideName}`, // Tag as GUIDE
                        class: 'Guide', // Generic class for guides
                        subject: meta.subject,
                        chapter: meta.chapter,
                        pageRange: page.page.toString(),
                        priority: 2 // GUIDE PRIORITY
                    });

                    chunkCount++;
                    process.stdout.write('.');
                }
            }
            console.log(`\n   ✅ Stored ${chunkCount} GUIDE chunks`);

        } catch (err) {
            console.error(`\n❌ Error processing ${file}:`, err);
        }
    }

    const total = ragDb.getStats();
    console.log(`\n🏁 Guide Ingestion Complete. Total DB Chunks: ${total}`);
}

main();
