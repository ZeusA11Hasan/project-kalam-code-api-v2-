import React from "react"
import { cn } from "@/lib/utils"

interface CartoonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  color?: string
  hasHighlight?: boolean
}

export function CartoonButton({
  label,
  children,
  color = "bg-black/40",
  hasHighlight = true,
  disabled = false,
  onClick,
  className,
  ...props
}: CartoonButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(e as any)
  }

  return (
    <div
      className={cn(
        "inline-block",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <button
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "group relative h-12 overflow-hidden rounded-xl border-2 border-white/10 px-6 text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition-all duration-150",
          "shadow-[0_5px_0_0_#000000] active:translate-y-[2px] active:shadow-none",
          "hover:-translate-y-[2px] hover:shadow-[0_7px_0_0_#000000]",
          color,
          disabled ? "pointer-events-none opacity-50" : ""
        )}
        {...props}
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {label || children}
        </div>

        {hasHighlight && !disabled && (
          <div className="pointer-events-none absolute left-[-100%] top-1/2 h-48 w-24 -translate-y-1/2 rotate-[35deg] bg-white/20 transition-all duration-700 ease-in-out group-hover:left-[200%]"></div>
        )}

        {/* Glossy top reflection */}
        <div className="absolute inset-x-0 top-0 z-20 h-px bg-white/20" />
      </button>
    </div>
  )
}
