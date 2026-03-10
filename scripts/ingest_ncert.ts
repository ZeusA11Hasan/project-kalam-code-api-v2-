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

const NCERT_DIR = path.resolve(process.cwd(), 'data/ncert_pdfs');

// --- TYPES ---
interface Metadata {
    class: string;
    subject: string;
    chapter: string;
}

// --- UTILS ---
// Heuristic to parse filename: "Class11_Physics_Chapter1_PhysicalWorld.pdf"
function parseFilename(filename: string): Metadata {
    // Simple heuristic or default to generic if format doesn't match
    // Expected: "Class<N>_<Subject>_Ch<N>_<Name>.pdf"
    const parts = filename.replace('.pdf', '').split('_');
    if (parts.length >= 3) {
        return {
            class: parts[0].replace('Class', ''),
            subject: parts[1],
            chapter: parts.slice(2).join(' ')
        };
    }
    return { class: 'Unknown', subject: 'Unknown', chapter: filename };
}

// Chunking Logic (400 tokens ~ 1500 chars, 50 token overlap ~ 200 chars)
function createChunks(text: string, maxChars = 1500, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxChars;
        if (end > text.length) end = text.length;

        // Try to break at a period or space to avoid cutting words
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            if (lastPeriod > start + maxChars * 0.8) {
                end = lastPeriod + 1;
            } else {
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start) end = lastSpace;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start += (maxChars - overlap);
    }
    return chunks;
}

// --- MAIN ---
async function main() {
    console.log("🚀 Starting NCERT Ingestion...");

    // 1. Scan Directory
    if (!fs.existsSync(NCERT_DIR)) {
        console.error(`❌ Data directory not found: ${NCERT_DIR}`);
        console.log("👉 Please create 'data/ncert_pdfs' and add PDFs.");
        process.exit(1);
    }

    const files = fs.readdirSync(NCERT_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`found ${files.length} PDFs`);

    for (const file of files) {
        console.log(`\n📄 Processing: ${file}`);
        const metadata = parseFilename(file);

        try {
            // 2. Read
            const buffer = filesystemMcp.readPDF(`data/ncert_pdfs/${file}`);

            // 3. Parse
            const pages = await pdfParserMcp.parseLikelyStructure(buffer);
            console.log(`   parsed ${pages.length} pages`);

            // 4. Chunk & Embed
            let chunkCount = 0;
            for (const page of pages) {
                const textChunks = createChunks(page.text);

                for (const chunkText of textChunks) {
                    if (chunkText.length < 50) continue; // Skip tiny chunks

                    // Generate Embedding
                    const result = await embeddingModel.embedContent(chunkText);
                    const vector = result.embedding.values;

                    // 5. Store
                    ragDb.insertChunk({
                        content: chunkText,
                        embedding: vector,
                        source: 'NCERT',
                        class: metadata.class,
                        subject: metadata.subject,
                        chapter: metadata.chapter,
                        pageRange: page.page.toString()
                    });
                    chunkCount++;
                    process.stdout.write('.');
                }
            }
            console.log(`\n   ✅ Stored ${chunkCount} chunks`);

        } catch (err) {
            console.error(`\n❌ Error processing ${file}:`, err);
        }
    }

    const total = ragDb.getStats();
    console.log(`\n🏁 Ingestion Complete. Total Chunks in DB: ${total}`);
}

main();
