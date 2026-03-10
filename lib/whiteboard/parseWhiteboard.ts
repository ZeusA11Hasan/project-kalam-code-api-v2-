import type { WhiteboardContentBlock } from "@/types/whiteboardSession";
import { WhiteboardResponseSchema } from "./schemas";
import { validateChemistryBlock, validateGraphBlock } from "./semanticGuards";

function isValidTableBlock(block: any): boolean {
    if (block.type !== 'table') return true;
    return (
        Array.isArray(block.headers) &&
        block.headers.length >= 2 &&
        Array.isArray(block.rows) &&
        block.rows.every((row: any) => Array.isArray(row) && row.length === block.headers.length)
    );
}

export function parseWhiteboardBlocks(raw: string): WhiteboardContentBlock[] | null {
    const blocks: WhiteboardContentBlock[] = [];
    const sanitized = raw.trim();

    // 0. Try Parsing Pure JSON (New Controller Mode)
    // The AI might return just a JSON object or array.
    if ((sanitized.startsWith("{") || sanitized.startsWith("[")) && !sanitized.startsWith("<")) {
        try {
            const parsed = JSON.parse(sanitized);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            for (const item of items) {
                // 🔐 STEP 2: LOCK THE SYSTEM - ZOD VALIDATION
                const validation = WhiteboardResponseSchema.safeParse(item);

                if (!validation.success) {
                    console.error("❌ [VALIDATION FAIL] Invalid Whiteboard JSON:", validation.error.format());
                    continue; // REJECT render
                }

                const validItem = validation.data;

                // 🔐 STEP 4: SEMANTIC GUARDS
                if (validItem.render === "chemistry") {
                    if (!validateChemistryBlock(validItem)) continue; // SKIP if semantic fail
                } else if (validItem.render === "graph" || validItem.render === "chart") {
                    if (!validateGraphBlock(validItem)) continue; // SKIP if semantic fail
                }

                if (validItem.render === "math") {
                    blocks.push({
                        type: "latex",
                        content: Array.isArray(validItem.content.latex)
                            ? validItem.content.latex.join("\n")
                            : (validItem.content.latex || "")
                    });
                }
                else if (validItem.render === "physics") {
                    // Map physics to latex for now, or a note with latex
                    const content = [
                        `\\textbf{${validItem.content.topic || "Physics Problem"}}`,
                        validItem.content.law ? `\\textit{Law: ${validItem.content.law}}` : "",
                        ...(Array.isArray(validItem.content.latex) ? validItem.content.latex : [validItem.content.latex || ""]),
                        validItem.content.final_answer ? `\\boxed{${validItem.content.final_answer}}` : ""
                    ].filter(Boolean).join("\n\n");

                    blocks.push({
                        type: "latex",
                        content: content
                    });
                }
                else if (validItem.render === "chemistry") {
                    blocks.push({
                        type: "chemistry",
                        content: {
                            reaction_name: validItem.content.reaction_name,
                            reactants: validItem.content.reactants,
                            products: validItem.content.products,
                            conditions: validItem.content.conditions,
                            structure: validItem.content.structure,
                            label: validItem.content.label
                        }
                    });
                }
                else if (validItem.render === "graph" || validItem.render === "chart") {
                    blocks.push({
                        type: "chart",
                        content: {
                            chartType: validItem.content.chart_type,
                            math_function: validItem.content.math_function,
                            domain: validItem.content.domain as any, // Cast for TS compatibility 
                            x_label: validItem.content.x_label,
                            y_label: validItem.content.y_label,
                            data: validItem.content.data
                        }
                    });
                }
                else if (validItem.render === "table") {
                    blocks.push({
                        type: "table",
                        headers: validItem.content.headers,
                        rows: validItem.content.rows
                    });
                }
            }

            // 🔐 STEP 5: OUTPUT CAPPING
            if (blocks.length > 2) {
                console.warn(`⚠️ [SAFETY] Capping whiteboard blocks from ${blocks.length} to 2.`);
                return blocks.slice(0, 2);
            }

            if (blocks.length > 0) return blocks;

        } catch (e) {
            // Not valid JSON, fall through to regex parsing
            // console.debug("Not pure JSON, trying regex...");
        }
    }

    // 1. Parse <whiteboard> JSON (Legacy/Fallback)
    const wbMatch = raw.match(/<whiteboard>([\s\S]*?)<\/whiteboard>/);
    if (wbMatch) {
        try {
            const parsed = JSON.parse(wbMatch[1]);
            if (Array.isArray(parsed.blocks)) {
                const valid = parsed.blocks.filter(
                    (b: any) =>
                        ["latex", "table", "canvas", "note", "chemistry", "chart", "mindmap"].includes(b.type)
                );
                blocks.push(...valid);
            }
        } catch (error) {
            console.warn("Failed to parse whiteboard JSON:", error);
        }
    }

    // 2. Parse <mindmap> JSON
    const mmMatch = raw.match(/<mindmap>([\s\S]*?)<\/mindmap>/);
    if (mmMatch) {
        try {
            const parsed = JSON.parse(mmMatch[1]);
            const enrichNodes = (nodes: any[]): any[] => {
                return nodes.map(n => ({
                    id: crypto.randomUUID(),
                    title: n.title,
                    children: Array.isArray(n.children) ? enrichNodes(n.children) : []
                }));
            };

            if (parsed.root && Array.isArray(parsed.nodes)) {
                blocks.push({
                    type: "mindmap",
                    root: parsed.root,
                    nodes: enrichNodes(parsed.nodes)
                });
            }
        } catch (error) {
            console.warn("Failed to parse mindmap JSON:", error);
        }
    }

    // 3. Parse <canvas> JSON
    const canvasMatch = raw.match(/<canvas>([\s\S]*?)<\/canvas>/);
    if (canvasMatch) {
        try {
            const parsed = JSON.parse(canvasMatch[1]);
            blocks.push({
                type: "canvas",
                payload: parsed
            } as any); // Type assertion mostly safe here if payload matches
        } catch (error) {
            console.warn("Failed to parse canvas JSON:", error);
        }
    }

    return blocks.length > 0 ? blocks : null;
}
