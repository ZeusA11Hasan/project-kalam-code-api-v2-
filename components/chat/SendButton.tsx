"use client"

import { motion } from "framer-motion"

interface SendButtonProps {
  onClick?: () => void
  disabled?: boolean
}

// Custom paper plane icon matching the reference design
function PaperPlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Paper plane outline */}
      <path d="M5 12 L12 5 L19 12 L12 19 Z" transform="rotate(45 12 12)" />
      <path d="M22 2 L11 13" />
      <path d="M22 2 L15 22 L11 13 L2 9 L22 2" />
      {/* Small dot */}
      <circle cx="13" cy="11" r="1" fill="currentColor" />
    </svg>
  )
}

export function SendButton({ onClick, disabled }: SendButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[42px] items-center justify-center rounded-full bg-black text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-80"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Paper plane arrow with loop tail */}
        <path d="M22 2 L15 22 L11 13 L2 9 L22 2" />
        <path d="M22 2 L11 13" />
        {/* Small dot */}
        <circle cx="14" cy="10" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </motion.button>
  )
}
