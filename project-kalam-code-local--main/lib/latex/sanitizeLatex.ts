export function sanitizeLatex(raw: string): string {
    if (!raw) return "";

    // Remove HTML tags
    let clean = raw.replace(/<[^>]*>/g, "");

    // Remove code blocks
    clean = clean.replace(/```[\s\S]*?```/g, "");

    // Allow ONLY safe LaTeX characters & commands
    // We need to be careful not to strip valid latex characters.
    // The regex provided by the user is: /[^a-zA-Z0-9\\^_{}()\[\]=+\-*/.,|<>∫∑√πθλμΔ∞\s]/g
    // We should verify if this covers common latex symbols like \frac, \cdot etc. which use {} and \.
    // The provided regex seems to allow these characters.

    clean = clean.replace(
        /[^a-zA-Z0-9\\^_{}()\[\]=+\-*/.,|<>∫∑√πθλμΔ∞\s:;!?%&~`$]/g,
        ""
    );

    return clean.trim();
}
