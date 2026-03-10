"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"
import { FC } from "react"
import { WhiteboardProvider } from "@/components/WhiteboardProvider"
import { AuthProvider } from "@/context/AuthContext"

export const Providers: FC<ThemeProviderProps> = ({ children, ...props }) => {
  return (
    <NextThemesProvider {...props}>
      <AuthProvider>
        <WhiteboardProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </WhiteboardProvider>
      </AuthProvider>
    </NextThemesProvider>
  )
}
