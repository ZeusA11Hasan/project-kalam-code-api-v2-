import pdf from 'pdf-parse';

export interface ParseResult {
    page: number;
    text: string;
}

/**
 * PDF Parser MCP
 * Extracts text and cleans it for NCERT ingestion
 */
export const pdfParserMcp = {
    parseLikelyStructure: async (buffer: Buffer): Promise<ParseResult[]> => {
        try {
            // pdf-parse gives us full text.
            // Note: pdf-parse doesn't strictly separate pages in the output text easily without using the render callback.
            // We will use a custom render callback to extract per-page text.

            const pages: ParseResult[] = [];

            await pdf(buffer, {
                pagerender: async (pageData: any) => {
                    // Extract text items from the page
                    const textContent = await pageData.getTextContent();
                    let pageText = '';

                    for (const item of textContent.items) {
                        pageText += (item.str + ' ');
                    }

                    // Clean the page text immediately
                    const cleanedText = cleanNCERTText(pageText);

                    if (cleanedText.length > 50) { // Skip empty/garbage pages
                        pages.push({
                            page: pageData.pageIndex + 1, // 1-based index
                            text: cleanedText
                        });
                    }

                    return pageText; // Return for main promise, though we use `pages` array
                }
            });

            return pages.sort((a, b) => a.page - b.page);

        } catch (error) {
            console.error("PDF Parse Error:", error);
            throw new Error("Failed to parse PDF");
        }
    }
};

/**
 * Cleaning Rules for NCERT Text
 */
function cleanNCERTText(text: string): string {
    let cleaned = text;

    // 1. Remove Headers/Footers (Heuristic: Short lines with mostly numbers or "Chapter")
    // This is hard on raw stream, but we can remove common patterns.

    // Remove multiple newlines
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');

    // Remove "Chapter X" repeated headers if they appear mid-page (simplified)
    // cleaned = cleaned.replace(/Chapter \d+/g, ''); 

    // Remove Exercise Strings
    cleaned = cleaned.replace(/EXERCISES?/gi, '');
    cleaned = cleaned.replace(/^\d+\.\s/gm, ''); // Remove leading question numbers "1. ", "2. "

    // Remove References
    cleaned = cleaned.replace(/References/gi, '');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}
