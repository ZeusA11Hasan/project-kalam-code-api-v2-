import { z } from "zod";

// Base Schema for shared validation logic if any
// ...

// 1. Math Attributes
export const MathSchema = z.object({
    render: z.literal("math"),
    content: z.object({
        topic: z.string().optional(),
        latex: z.array(z.string()).or(z.string()), // Accept both for flexibility
        steps: z.array(z.string()).optional(),
        final_answer: z.string().optional()
    })
});

// 2. Physics Attributes
export const PhysicsSchema = z.object({
    render: z.literal("physics"),
    content: z.object({
        topic: z.string().optional(),
        law: z.string().optional(),
        latex: z.array(z.string()).or(z.string()).optional(),
        given: z.record(z.string()).optional(),
        solution_steps: z.array(z.string()).optional(),
        final_answer: z.string().optional()
    })
});

// 3. Chemistry Content Schema
export const ChemistryContentSchema = z.object({
    reaction_name: z.string().optional(),
    reactants: z.array(z.object({
        name: z.string(),
        smiles: z.string()
    })).optional(),
    reagents: z.array(z.string()).optional(),
    conditions: z.string().optional(),
    products: z.array(z.object({
        name: z.string(),
        smiles: z.string()
    })).optional(),
    // Support simple structure mode too if AI drifts
    structure: z.string().optional(),
    label: z.string().optional()
});

export const ChemistrySchema = z.object({
    render: z.literal("chemistry"),
    content: ChemistryContentSchema
});

// 4. Graph/Chart Schema
export const GraphSchema = z.object({
    render: z.union([z.literal("graph"), z.literal("chart")]),
    content: z.object({
        chart_type: z.enum(["line", "bar", "pie", "area"]).default("line"),
        math_function: z.string().optional(),
        domain: z.array(z.union([z.number(), z.string()])).optional(), // [min, max]
        shade_between: z.array(z.any()).optional(),
        x_label: z.string().optional(),
        y_label: z.string().optional(),
        data: z.array(z.any()).optional() // Fallback
    })
});

// 5. Table Schema
export const TableSchema = z.object({
    render: z.literal("table"),
    content: z.object({
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string()))
    })
});

// Union of all supported renders
export const WhiteboardResponseSchema = z.union([
    MathSchema,
    PhysicsSchema,
    ChemistrySchema,
    GraphSchema,
    TableSchema
]);

export type WhiteboardResponse = z.infer<typeof WhiteboardResponseSchema>;
