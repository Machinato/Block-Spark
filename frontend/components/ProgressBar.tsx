"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { cn, progressPercent } from "@/lib/utils"

interface ProgressBarProps {
  raised: string | bigint | number
  target: string | bigint | number
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
  const [hasAnimated, setHasAnimated] = useState(!animate)

  const percent = progressPercent(raised, target)

  useEffect(() => {
    if (!animate) return
    if (typeof IntersectionObserver === 'undefined') {
      setHasAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setHasAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [animate])

  return (
    <div className={cn("w-full", className)} ref={ref}>
      <div
        className={cn(
          "w-full bg-secondary rounded-full overflow-hidden",
          heightClasses[height]
        )}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-prism-from to-prism-to transition-all duration-700 ease-out"
          style={{ width: hasAnimated ? `${percent}%` : '0%' }}
        />
      </div>
      {showPercent && (
        <div className="flex justify-end mt-1">
          <span className="text-sm font-medium text-prism-from">
            {percent.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}
