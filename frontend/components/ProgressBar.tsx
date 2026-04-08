"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { cn, progressPercent } from "@/lib/utils"

interface ProgressBarProps {
  raised: string
  target: string
  className?: string
  height?: "sm" | "md" | "lg"
  showPercent?: boolean
  animate?: boolean
}

const heightClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
}

export function ProgressBar({
  raised,
  target,
  className,
  height = "md",
  showPercent = false,
  animate = true,
}: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const [hasAnimated, setHasAnimated] = useState(!animate)
  
  const percent = progressPercent(raised, target)

  useEffect(() => {
    if (isInView && animate) {
      setHasAnimated(true)
    }
  }, [isInView, animate])

  return (
    <div className={cn("w-full", className)} ref={ref}>
      <div
        className={cn(
          "w-full bg-[#1e1730] rounded-full overflow-hidden",
          heightClasses[height]
        )}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: hasAnimated ? `${percent}%` : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {showPercent && (
        <div className="flex justify-end mt-1">
          <span className="text-sm font-medium text-fuchsia-400">
            {percent.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}
