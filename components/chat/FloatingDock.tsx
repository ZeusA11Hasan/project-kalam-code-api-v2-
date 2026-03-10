"use client"

import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform
} from "framer-motion"
import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  MessageSquare,
  Bookmark,
  Star,
  Trash2,
  HelpCircle
} from "lucide-react"

// Section items for the expandable panel
export const sectionItems = [
  { title: "Current", icon: <MessageSquare className="size-4" />, count: 12 },
  { title: "Bookmark", icon: <Bookmark className="size-4" />, count: 25 },
  { title: "Favorites", icon: <Star className="size-4" />, count: 77 },
  { title: "Trash", icon: <Trash2 className="size-4" />, count: 1 },
  { title: "Unassigned", icon: <HelpCircle className="size-4" />, count: 97 }
]

export const FloatingDock = ({
  items,
  className,
  onNewChat,
  onSectionSelect
}: {
  items: { title: string; icon: React.ReactNode; href: string }[]
  className?: string
  onNewChat?: () => void
  onSectionSelect?: (section: string) => void
}) => {
  let mouseY = useMotionValue(Infinity)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDockHovered, setIsDockHovered] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {/* Main Sidebar - Dynamically expands on hover */}
      <motion.div
        onMouseMove={e => mouseY.set(e.pageY)}
        onMouseEnter={() => setIsDockHovered(true)}
        onMouseLeave={() => {
          mouseY.set(Infinity)
          setIsDockHovered(false)
        }}
        animate={{
          height: isDockHovered ? "94vh" : "85vh"
        }}
        transition={{
          height: { type: "spring", stiffness: 200, damping: 25 }
        }}
        className={cn(
          "flex flex-col items-center justify-between rounded-[48px] bg-[#0d0d0f] px-3 py-6 shadow-[-16px_-16px_32px_rgba(255,255,255,0.05),16px_16px_32px_rgba(0,0,0,1),inset_1px_1px_2px_rgba(255,255,255,0.05)]",
          className
        )}
      >
        {/* Top Section - Expand Button + Icons */}
        <div className="flex flex-col items-center">
          {/* Expand Button at Top */}
          <div className="group relative mb-6">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-white/40 shadow-[-8px_-8px_16px_rgba(255,255,255,0.06),8px_8px_16px_rgba(0,0,0,1)] transition-all duration-300 hover:text-white hover:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(0,0,0,1)]"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="size-5" />
              </motion.div>
            </motion.button>

            {/* Floating Tag (Tooltip) */}
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <div className="relative whitespace-nowrap rounded-full border border-white/10 bg-black px-4 py-1.5 text-[11px] font-bold text-white shadow-2xl">
                {isExpanded ? "Collapse" : "Categories"}
                {/* Triangle Arrow */}
                <div className="absolute left-0 top-1/2 size-1.5 -translate-x-1 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-black" />
              </div>
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex flex-col items-center gap-5">
            {items.map(item => (
              <IconContainer mouseY={mouseY} key={item.title} {...item} />
            ))}
          </div>
        </div>

        {/* Bottom Avatar Section */}
        <div className="group relative mt-6">
          <div className="flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/[0.03] bg-[#0d0d0f] shadow-[-8px_-8px_16px_rgba(255,255,255,0.06),8px_8px_16px_rgba(0,0,0,1)] transition-all duration-300 hover:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(0,0,0,1)]">
            <img
              src="/max-avatar.png"
              alt="Profile"
              className="size-[88%] rounded-full object-cover"
            />
          </div>
          {/* Notification Badge */}
          <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-lg">
            3
          </div>

          {/* Floating Tag (Tooltip) */}
          <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <div className="relative whitespace-nowrap rounded-full border border-white/10 bg-black px-4 py-1.5 text-[11px] font-bold text-white shadow-2xl">
              Account & Profile
              {/* Triangle Arrow */}
              <div className="absolute left-0 top-1/2 size-1.5 -translate-x-1 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-black" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expandable Section Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-[85vh] overflow-hidden rounded-[32px] border border-white/10 bg-black/30 shadow-[0px_0px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          >
            <div className="flex h-full w-56 flex-col px-4 py-6">
              {/* Header */}
              <div className="mb-4 px-2">
                <h3 className="text-sm font-semibold text-white/90">
                  Categories
                </h3>
                <p className="mt-1 text-xs text-white/40">All Conversations</p>
              </div>

              {/* Section Items */}
              <div className="flex flex-1 flex-col gap-1">
                {sectionItems.map((item, index) => (
                  <motion.button
                    key={item.title}
                    onClick={() => onSectionSelect?.(item.title)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-white/60 transition-colors group-hover:text-white">
                        {item.icon}
                      </div>
                      <span className="text-sm text-white/70 transition-colors group-hover:text-white">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs text-white/40 transition-colors group-hover:text-white/70">
                      {item.count}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Bottom Action */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <button
                  onClick={onNewChat}
                  className="relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-medium tracking-wide text-white/80 backdrop-blur-md transition-all duration-300 ease-out hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_0_25px_rgba(0,255,200,0.12)] active:scale-95 active:bg-white/15"
                >
                  <div className="size-2 animate-pulse rounded-full bg-teal-400 opacity-70" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function IconContainer({
  mouseY,
  title,
  icon,
  href
}: {
  mouseY: MotionValue
  title: string
  icon: React.ReactNode
  href: string
}) {
  let ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isActive = pathname === href

  let distance = useTransform(mouseY, val => {
    let bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 }
    return val - bounds.y - bounds.height / 2
  })

  let widthTransform = useTransform(distance, [-120, 0, 120], [56, 82, 56])
  let heightTransform = useTransform(distance, [-120, 0, 120], [56, 82, 56])

  let widthIconTransform = useTransform(distance, [-120, 0, 120], [24, 44, 24])
  let heightIconTransform = useTransform(distance, [-120, 0, 120], [24, 44, 24])

  let width = useSpring(widthTransform, {
    mass: 0.15,
    stiffness: 260,
    damping: 15
  })
  let height = useSpring(heightTransform, {
    mass: 0.15,
    stiffness: 260,
    damping: 15
  })

  let widthIcon = useSpring(widthIconTransform, {
    mass: 0.15,
    stiffness: 260,
    damping: 15
  })
  let heightIcon = useSpring(heightIconTransform, {
    mass: 0.15,
    stiffness: 260,
    damping: 15
  })

  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "sidebar-btn group relative flex aspect-square items-center justify-center rounded-full bg-[#0d0d0f] transition-all duration-200",
          isActive
            ? "border border-white/5 shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(0,0,0,1)]"
            : "border border-transparent shadow-[-8px_-8px_16px_rgba(255,255,255,0.06),8px_8px_16px_rgba(0,0,0,1)] hover:border-white/5 hover:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(0,0,0,1)]"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute left-full z-50 ml-4"
            >
              <div className="relative whitespace-nowrap rounded-full border border-white/10 bg-[#0d0d0f] px-4 py-1.5 text-[11px] font-bold text-white shadow-2xl">
                {title}
                <div className="absolute left-0 top-1/2 size-1.5 -translate-x-1 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-[#0d0d0f]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "relative z-10 flex items-center justify-center transition-all duration-200",
            isActive
              ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              : "text-white/40 group-hover:text-white/90 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          )}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  )
}
