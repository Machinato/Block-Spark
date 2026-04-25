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
    const [mounted, setMounted] = useState(false)
    const [remaining, setRemaining] = useState<string>("")

    useEffect(() => {
        setMounted(true)
        setRemaining(timeRemaining(endTimestamp))
        
        const interval = setInterval(() => {
            setRemaining(timeRemaining(endTimestamp))
        }, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [endTimestamp])

    const isEnded = mounted && remaining === "Ended"
    const displayText = !mounted ? "--" : (isEnded ? "Ended" : `${remaining} left`)

    return (
        <div
            className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                isEnded ? "text-muted-foreground" : "text-prism-to",
                className
            )}
        >
            {showIcon && <Clock className={cn("w-4 h-4", !mounted && "opacity-50")} />}
            <span>{displayText}</span>
        </div>
    )
}