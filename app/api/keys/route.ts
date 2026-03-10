export const dynamic = "force-dynamic"

export async function GET() {
    const isUsingEnvKeyMap = {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_GEMINI_API_KEY,
        mistral: !!process.env.MISTRAL_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        perplexity: !!process.env.PERPLEXITY_API_KEY,
        azure: !!process.env.AZURE_OPENAI_API_KEY,
    }

    return new Response(JSON.stringify({ isUsingEnvKeyMap }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
}
