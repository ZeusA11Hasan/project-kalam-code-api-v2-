"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FeatureCardProps {
  title: string
  subtitle: string
  tag: string
  icon?: ReactNode
  onClick?: () => void
}

export function FeatureCard({
  title,
  subtitle,
  tag,
  icon,
  onClick
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-lg transition-all duration-300 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Tag */}
      <div className="absolute right-4 top-4">
        <span className="rounded-full border border-white/15 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 px-3 py-1 text-xs font-medium text-white/90">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div className="mt-3 space-y-3">
        {icon && (
          <div className="text-cyan-400/80 transition-colors group-hover:text-cyan-300">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-white">
          {title}
        </h3>

        <p className="text-sm leading-relaxed text-white/60 transition-colors group-hover:text-white/80">
          {subtitle}
        </p>
      </div>

      {/* Hover glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
      </div>
    </motion.div>
  )
}
