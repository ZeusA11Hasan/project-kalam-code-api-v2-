"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  className?: string
}

export function IconButton({
  icon: Icon,
  onClick,
  className = ""
}: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`flex items-center justify-center text-[#9BA1A6] transition-colors hover:text-[#6B7280] ${className}`}
    >
      <Icon className="size-[18px]" />
    </motion.button>
  )
}
