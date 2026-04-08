"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { timeRemaining } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface TimeRemainingProps {
  endTimestamp: number
  showIcon?: boolean
  className?: string
}

export function TimeRemaining({
  endTimestamp,
  showIcon = true,
  className,
}: TimeRemainingProps) {
  const [remaining, setRemaining] = useState(timeRemaining(endTimestamp))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(timeRemaining(endTimestamp))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [endTimestamp])

  const isEnded = remaining === "Ended"

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm",
        isEnded ? "text-violet-400/50" : "text-orange-400/80",
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4" />}
      <span>{isEnded ? "Ended" : `${remaining} left`}</span>
    </div>
  )
}
