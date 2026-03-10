"use client"

import { HangmanGame } from "@/components/HangmanGame"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { Home, Sparkles, BookOpen, Calculator, User } from "lucide-react"

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Features", url: "/#features", icon: Sparkles },
  { name: "Library", url: "/#library", icon: BookOpen },
  { name: "Pricing", url: "/#pricing", icon: Calculator },
  { name: "Profile", url: "/#profile", icon: User }
]

export default function GamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Consistent Navbar */}
      <NavBar items={navItems} />

      {/* The Game */}
      <HangmanGame />

      {/* Subtle floating glass footer note */}
      <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/5 bg-black/20 px-6 py-2 backdrop-blur-md">
        <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Premium Gamified Learning Interface • Quantum AI Edition
        </p>
      </div>
    </main>
  )
}
