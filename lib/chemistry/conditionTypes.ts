export type ReactionConditions = {
    substrate: "primary" | "secondary" | "tertiary" | "unknown";
    nucleophile: "strong" | "weak" | "none" | "unknown";
    base: "strong" | "weak" | "none" | "unknown";
    solvent: "polar_protic" | "polar_aprotic" | "unknown";
    temperature: "high" | "low" | "unknown";
};
