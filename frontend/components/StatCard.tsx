"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView, useSpring, useTransform, useMotionValue } from "framer-motion"

interface StatCardProps {
    label: string
    value: string | bigint | number
    suffix?: string
    prefix?: string
    decimals?: number
}

// Format number consistently without locale-dependent formatting
function formatNumber(num: number, decimals: number): string {
    if (decimals > 0) {
        return num.toFixed(decimals)
    }
    return Math.floor(num).toString()
}

export function StatCard({
    label,
    value,
    suffix = "",
    prefix = "",
    decimals = 0,
}: StatCardProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true })
    const [mounted, setMounted] = useState(false)

    // Use progress (0 to 1) to animate regardless of the final value type/size
    const progress = useMotionValue(0)
    const springProgress = useSpring(progress, {
        stiffness: 50,
        damping: 15,
        mass: 1,
    })

    // Track mount state to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isInView || !mounted) return
        progress.set(1)
    }, [isInView, mounted, progress])

    // useTransform handles the dynamic scaling up to the exact target
    const displayValue = useTransform(springProgress, (p) => {
        if (!mounted) return formatNumber(0, decimals)
        
        // Clamp to prevent overshooting visual bounce bugs
        const clampedP = Math.min(Math.max(p, 0), 1)

        if (typeof value === 'bigint') {
            if (clampedP >= 1) return value.toString()
            const scaled =  BigInt(Math.floor(clampedP * 10000))
            const current = (value * scaled) / 10000n
            return current.toString()
        } else {
            const numValue = Number(value) || 0
            if (clampedP >= 1) return formatNumber(numValue, decimals)
            return formatNumber(numValue * clampedP, decimals)
        }
    })

    return (
        <div
            ref={ref}
            className="flex flex-col items-center p-6 bg-card border border-border rounded-lg hover:border-prism-from/30 transition-colors"
        >
            <span className="text-3xl md:text-4xl font-bold tabular-nums text-foreground">
                {prefix}<motion.span>{displayValue}</motion.span>{suffix}
            </span>
            <span className="text-sm text-muted-foreground mt-2">{label}</span>
        </div>
    )
}