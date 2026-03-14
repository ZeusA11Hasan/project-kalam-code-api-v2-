"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

import { LucideIcon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 left-1/2 z-50 mb-6 h-fit w-full max-w-[95%] -translate-x-1/2 sm:bottom-auto sm:top-0 sm:mb-0 sm:max-w-[95%] sm:pt-4 md:max-w-[min(90%,1100px)] md:pt-5 lg:max-w-6xl lg:pt-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-white/5 bg-[#0a0a0a]/80 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5 backdrop-blur-2xl transition-all sm:gap-2 md:flex-nowrap md:gap-2 md:px-2 lg:gap-3 lg:px-3">
        {items.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-xs font-semibold sm:px-4 md:px-4 md:text-sm lg:px-6",
                "text-white/60 transition-all hover:text-white",
                isActive && "bg-white/5 text-cyan-400"
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="flex items-center justify-center md:hidden">
                <Icon size={18} strokeWidth={2.5} className="shrink-0" />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-cyan-500/5"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-cyan-400">
                    <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-cyan-400/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-cyan-400/20 blur-md" />
                    <div className="absolute left-2 top-0 size-4 rounded-full bg-cyan-400/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* Auth Button — responsive padding for tablet */}
        {user ? (
          <Button
            variant="neumorphic"
            size="sm"
            onClick={() => signOut()}
            className="flex items-center justify-center rounded-full px-3 md:px-4 lg:px-6"
          >
            <span className="hidden md:inline">Sign Out</span>
            <LogOut size={16} strokeWidth={2.5} className="shrink-0 md:ml-0" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
