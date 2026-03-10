"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-black uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 select-none overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-black/60 text-white border-2 border-white/10 shadow-[0_4px_0_0_#000000] hover:shadow-[0_6px_0_0_#000000] backdrop-blur-md",
        destructive: "bg-red-600/60 text-white border-2 border-red-800/20 shadow-[0_4px_0_0_#991b1b] hover:shadow-[0_6px_0_0_#991b1b] backdrop-blur-md",
        outline: "bg-white/5 text-white/70 border-2 border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.5)] backdrop-blur-md hover:text-white",
        secondary: "bg-zinc-800/80 text-white border-2 border-zinc-950/20 shadow-[0_4px_0_0_#09090b] hover:shadow-[0_6px_0_0_#09090b] backdrop-blur-md",
        ghost: "hover:bg-white/5 text-white active:bg-white/10 border-0",
        link: "text-cyan-400 underline-offset-4 hover:underline border-0",
        premium: "bg-gradient-to-br from-cyan-600/80 to-blue-700/80 text-white border-2 border-white/10 shadow-[0_4px_0_0_#000000] hover:shadow-[0_6px_0_0_#000000] backdrop-blur-md",
        neumorphic: "bg-gradient-to-br from-[rgba(18,18,21,0.92)] to-[rgba(10,10,12,0.92)] backdrop-blur-md text-white/50 border border-white/[0.03] shadow-[-12px_-12px_24px_rgba(255,255,255,0.02),12px_12px_24px_rgba(0,0,0,0.8)] hover:shadow-[-6px_-6px_12px_rgba(255,255,255,0.015),8px_8px_16px_rgba(0,0,0,0.7)] active:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.01),inset_10px_10px_20px_rgba(0,0,0,0.9)] hover:text-white transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-[11px]",
        lg: "h-14 px-10 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as any}
          {...(props as any)}
        />
      )
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{
          y: -2,
          transition: { duration: 0.1 }
        }}
        whileTap={{
          y: 2,
          transition: { duration: 0.05 }
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        {...(props as any)}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children as any}
        </span>

        {/* Cartoon Highlight Sweep */}
        <div className="absolute top-1/2 left-[-150%] w-32 h-64 bg-white/10 -translate-y-1/2 rotate-[35deg] transition-all duration-[8000ms] ease-in-out group-hover:left-[150%] pointer-events-none" />

        {/* Top Glossy Edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
