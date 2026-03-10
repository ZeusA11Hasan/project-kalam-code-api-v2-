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
import { LucideIcon } from "lucide-react"

interface FeatureItem {
  title: string
  icon: LucideIcon
  onClick?: () => void
}

interface FeatureDockProps {
  items: FeatureItem[]
  className?: string
}

export function FeatureDock({ items, className }: FeatureDockProps) {
  let mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={e => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex flex-row items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl",
        className
      )}
    >
      {items.map(item => (
        <FeatureIconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  )
}

function FeatureIconContainer({
  mouseX,
  title,
  icon: Icon,
  onClick
}: {
  mouseX: MotionValue
  title: string
  icon: LucideIcon
  onClick?: () => void
}) {
  let ref = useRef<HTMLButtonElement>(null)

  let distance = useTransform(mouseX, val => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  // Size transforms based on mouse distance (horizontal)
  let widthTransform = useTransform(distance, [-120, 0, 120], [120, 160, 120])
  let heightTransform = useTransform(distance, [-120, 0, 120], [40, 52, 40])
  let iconSizeTransform = useTransform(distance, [-120, 0, 120], [16, 22, 16])
  let fontSizeTransform = useTransform(distance, [-120, 0, 120], [13, 15, 13])

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  })
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  })
  let iconSize = useSpring(iconSizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  })
  let fontSize = useSpring(fontSizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  })

  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer items-center justify-center gap-2 rounded-full backdrop-blur-sm transition-colors",
        hovered
          ? "bg-white/20 shadow-lg shadow-white/10"
          : "bg-white/10 hover:bg-white/15"
      )}
    >
      <motion.div
        style={{ width: iconSize, height: iconSize }}
        className="flex items-center justify-center"
      >
        <Icon className="size-full text-white/90" />
      </motion.div>
      <motion.span
        style={{ fontSize }}
        className="whitespace-nowrap font-medium text-white/90"
      >
        {title}
      </motion.span>
    </motion.button>
  )
}

export { FeatureIconContainer }
