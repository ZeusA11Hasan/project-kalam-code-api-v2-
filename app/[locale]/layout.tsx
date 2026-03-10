import { Toaster } from "@/components/ui/sonner"
import { GlobalState } from "@/components/utility/global-state"
import { Providers } from "@/components/utility/providers"
import TranslationsProvider from "@/components/utility/translations-provider"
import initTranslations from "@/lib/i18n"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { Metadata, Viewport } from "next"
import { Inter, Outfit, Darker_Grotesque } from "next/font/google"
import { cookies } from "next/headers"
import Script from "next/script"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' })
const darkerGrotesque = Darker_Grotesque({ subsets: ["latin"], variable: '--font-darker-grotesque' })
const APP_NAME = "Chatbot UI"
const APP_DEFAULT_TITLE = "Chatbot UI"
const APP_TITLE_TEMPLATE = "%s - Chatbot UI"
const APP_DESCRIPTION = "Chabot UI PWA!"

interface RootLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: APP_DEFAULT_TITLE
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg"
  }
}

export const viewport: Viewport = {
  themeColor: "#000000"
}

const i18nNamespaces = ["translation"]

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  const { t, resources } = await initTranslations(locale, i18nNamespaces)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, outfit.variable, darkerGrotesque.variable)}>
        <Providers attribute="class" defaultTheme="dark">
          <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={locale}
            resources={resources}
          >
            <Toaster richColors position="top-center" duration={3000} />

            {/* 🔥 FULLSCREEN VIDEO BACKGROUND */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 size-full object-cover"
              >
                <source src="/background.mp4" type="video/mp4" />
              </video>
              {/* Subtle overlay for better text contrast */}
              <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* 🔮 GLASS FOREGROUND */}
            <div className="text-foreground relative z-10 flex h-dvh flex-col items-center overflow-x-auto">
              <GlobalState>{children}</GlobalState>
            </div>
            <Script
              src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
              strategy="beforeInteractive"
            />
          </TranslationsProvider>
        </Providers>
      </body>
    </html>
  )
}
