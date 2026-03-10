import { createClient } from "@/lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  const i18nResult = i18nRouter(request, i18nConfig)
  if (i18nResult) return i18nResult

  try {
    const { supabase, response } = createClient(request)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    const isHomePath = pathname === "/" || i18nConfig.locales.some(locale => pathname === `/${locale}`)

    const redirectToChat = session && isHomePath

    if (redirectToChat) {
      const { data: homeWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_home", true)
        .single()

      if (homeWorkspace) {
        return NextResponse.redirect(
          new URL(`/${homeWorkspace.id}/chat`, request.url)
        )
      }
    }

    return response
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
