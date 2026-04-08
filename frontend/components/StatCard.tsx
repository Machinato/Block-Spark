"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

interface StatCardProps {
  label: string
  value: number
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
  const [displayValue, setDisplayValue] = useState(0)

  // Track mount state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isInView || !mounted) return

    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps
    const increment = value / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [isInView, value, mounted])

  // Use consistent formatting that doesn't depend on locale
  const formattedValue = formatNumber(mounted ? displayValue : 0, decimals)

  return (
    <div
      ref={ref}
      className="flex flex-col items-center p-6 bg-[#130f1f]/80 rounded-xl border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-colors"
    >
      <span className="text-3xl md:text-4xl font-bold currents-text">
        {prefix}{formattedValue}{suffix}
      </span>
      <span className="text-sm text-violet-300/60 mt-2">{label}</span>
    </div>
  )
}
