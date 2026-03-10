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
                "fixed bottom-0 sm:top-0 sm:bottom-auto left-1/2 -translate-x-1/2 z-50 mb-6 sm:mb-0 sm:pt-6 h-fit",
                className,
            )}
        >
            <div className="flex items-center gap-3 bg-[#0a0a0a]/80 border border-white/5 ring-1 ring-white/5 backdrop-blur-2xl py-1 px-1 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.name

                    return (
                        <Link
                            key={item.name}
                            href={item.url}
                            onClick={() => setActiveTab(item.name)}
                            className={cn(
                                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                "text-white/60 hover:text-white transition-all",
                                isActive && "bg-white/5 text-cyan-400",
                            )}
                        >
                            <span className="hidden md:inline">{item.name}</span>
                            <span className="md:hidden">
                                <Icon size={18} strokeWidth={2.5} />
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="lamp"
                                    className="absolute inset-0 w-full bg-cyan-500/5 rounded-full -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-t-full">
                                        <div className="absolute w-12 h-6 bg-cyan-400/20 rounded-full blur-md -top-2 -left-2" />
                                        <div className="absolute w-8 h-6 bg-cyan-400/20 rounded-full blur-md -top-1" />
                                        <div className="absolute w-4 h-4 bg-cyan-400/20 rounded-full blur-sm top-0 left-2" />
                                    </div>
                                </motion.div>
                            )}
                        </Link>
                    )
                })}

                {/* Auth Button */}
                {user ? (
                    <Button
                        variant="neumorphic"
                        size="sm"
                        onClick={() => signOut()}
                        className="rounded-full px-6"
                    >
                        <span className="hidden md:inline">Sign Out</span>
                        <LogOut size={16} strokeWidth={2.5} />
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
