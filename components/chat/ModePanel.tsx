"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Presentation,
  LineChart,
  Sparkles,
  HelpCircle,
  FileUp
} from "lucide-react"
import { FeatureDock } from "./FeatureDock"

interface ModePanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode?: (mode: string) => void
}

export function ModePanel({ isOpen, onClose, onSelectMode }: ModePanelProps) {
  const handleSelect = (mode: string) => {
    if (onSelectMode) {
      onSelectMode(mode)
    }
    onClose()
  }

  const featureItems = [
    {
      title: "Whiteboard",
      icon: Presentation,
      onClick: () => handleSelect("whiteboard")
    },
    { title: "Graph", icon: LineChart, onClick: () => handleSelect("graph") },
    {
      title: "Live Teach",
      icon: Sparkles,
      onClick: () => handleSelect("live-teach")
    },
    {
      title: "Quiz Mode",
      icon: HelpCircle,
      onClick: () => handleSelect("quiz")
    },
    {
      title: "Upload Notes",
      icon: FileUp,
      onClick: () => handleSelect("upload")
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-x-0 bottom-full z-50 mb-3 flex justify-center"
          >
            <FeatureDock items={featureItems} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
