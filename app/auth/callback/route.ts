import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        try {
            // Step 1: Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error("[Auth Callback] Session exchange error:", error.message)
                return NextResponse.redirect(`${origin}/?error=auth-code-error`)
            }

            if (data?.user) {
                // Step 2: Auth is complete — now safely upsert into custom users table
                // Uses onConflict: 'id' so returning users don't cause a 409
                try {
                    const { error: dbError } = await supabase
                        .from('users')
                        .upsert(
                            {
                                id: data.user.id,
                                email: data.user.email,
                                xp: 0,
                                level: 1,
                                streak_count: 0,
                            },
                            {
                                onConflict: 'id',
                                // ignoreDuplicates ensures existing xp/level/streak are NOT reset
                                ignoreDuplicates: true,
                            }
                        )

                    if (dbError) {
                        console.error("[Auth Callback] DB upsert error:", dbError.message)
                        console.error("[Auth Callback] DB error details:", dbError.code, dbError.details, dbError.hint)
                    }
                } catch (dbErr: any) {
                    console.error("[Auth Callback] DB operation threw:", dbErr.message || dbErr)
                    // Don't block login — auth succeeded, DB is secondary
                }

                // Redirect to the originally requested URL
                return NextResponse.redirect(`${origin}${next}`)
            }
        } catch (e: any) {
            console.error("[Auth Callback] Unexpected error:", e.message || e)
        }
    }

    // Fallback: return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}
