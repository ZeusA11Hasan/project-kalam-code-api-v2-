"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share2, Check, UserPlus, Users, X } from "lucide-react"
import { Button } from "./button"

interface Profile {
  id: string
  name: string
  bio: string
  avatar: string
  status: "online" | "offline"
}

const MOCK_PROFILES: Profile[] = [
  {
    id: "1",
    name: "Alex Rivera",
    bio: "Fullstack Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    status: "online"
  },
  {
    id: "2",
    name: "Sarah Chen",
    bio: "AI Researcher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    status: "online"
  },
  {
    id: "3",
    name: "Marcus Thorne",
    bio: "UI/UX Designer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    status: "online"
  },
  {
    id: "4",
    name: "Elena Vance",
    bio: "Product Manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    status: "offline"
  },
  {
    id: "5",
    name: "Gordon Freeman",
    bio: "Theoretical Physicist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gordon",
    status: "offline"
  },
  {
    id: "6",
    name: "Alyx Vance",
    bio: "Rebel Leader",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alyx",
    status: "offline"
  },
  {
    id: "7",
    name: "Barney Calhoun",
    bio: "Security Guard",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Barney",
    status: "offline"
  },
  {
    id: "8",
    name: "Isaac Kleiner",
    bio: "Scientist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isaac",
    status: "offline"
  }
]

export const SharePopover = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const [invitedIds, setInvitedIds] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const onlineUsers = MOCK_PROFILES.filter(p => p.status === "online")
  const offlineUsers = MOCK_PROFILES.filter(p => p.status === "offline")

  const handleInvite = (id: string) => {
    setInvitedIds(prev => [...prev, id])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md overflow-hidden rounded-[20px] border border-white/10 bg-[#0f0f12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-2xl"
          >
            {/* Title Bar */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <Users className="size-4 text-cyan-400" />
                <h3 className="text-[15px] font-bold tracking-tight text-white/90">
                  Invite Friends
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="custom-scrollbar-thin max-h-[460px] space-y-6 overflow-y-auto px-2 py-4">
              {/* Online Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4">
                  <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/30">
                    Online — {onlineUsers.length}
                  </span>
                </div>
                {onlineUsers.length === 0 ? (
                  <p className="px-4 text-[13px] italic text-white/20">
                    No one is online right now.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {onlineUsers.map(profile => (
                      <ProfileRow
                        key={profile.id}
                        profile={profile}
                        isInvited={invitedIds.includes(profile.id)}
                        onInvite={() => handleInvite(profile.id)}
                        onHover={() => setHoveredId(profile.id)}
                        onLeave={() => setHoveredId(null)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Offline Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4">
                  <div className="size-1.5 rounded-full bg-white/10" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/30">
                    Offline — {offlineUsers.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {offlineUsers.map(profile => (
                    <ProfileRow
                      key={profile.id}
                      profile={profile}
                      isInvited={invitedIds.includes(profile.id)}
                      onInvite={() => handleInvite(profile.id)}
                      onHover={() => setHoveredId(profile.id)}
                      onLeave={() => setHoveredId(null)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const ProfileRow = ({
  profile,
  isInvited,
  onInvite,
  onHover,
  onLeave
}: {
  profile: Profile
  isInvited: boolean
  onInvite: () => void
  onHover: () => void
  onLeave: () => void
}) => {
  const isOnline = profile.status === "online"

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{
        scale: 1.015,
        backgroundColor: "rgba(255, 255, 255, 0.03)"
      }}
      className="group relative flex cursor-default items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-200"
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div
          className={`size-11 overflow-hidden rounded-full border border-white/10 p-0.5 transition-all duration-300 ${isOnline ? "ring-2 ring-cyan-500/20" : ""}`}
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="size-full rounded-full object-cover"
          />
        </div>
        {/* Status Dot */}
        <div
          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#0f0f12] ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-gray-500"}`}
        />

        {/* Subtle Glow for Online */}
        {isOnline && (
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-cyan-400/5 blur-xl" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col">
          <span className="truncate text-[14px] font-semibold text-white/90">
            {profile.name}
          </span>
          <span className="truncate text-[12px] text-white/40">
            {profile.bio}
          </span>
        </div>
      </div>

      {/* Invite Button Area */}
      <div className="relative flex h-[32px] w-[80px] shrink-0 items-center justify-end">
        <AnimatePresence mode="wait">
          {isInvited ? (
            <motion.div
              key="invited"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[12px] font-bold text-cyan-400"
            >
              <Check className="size-3.5" />
              <span>Invited</span>
            </motion.div>
          ) : (
            <Button
              key="invite"
              variant="default"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                onInvite()
              }}
              className="h-8 rounded-full px-4 opacity-0 group-hover:opacity-100"
            >
              Invite
            </Button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Add custom scrollbar styles to global or component level
const globalStyles = `
  .custom-scrollbar-thin::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.innerHTML = globalStyles
  document.head.appendChild(style)
}
