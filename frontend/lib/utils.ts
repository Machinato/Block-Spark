import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format ETH: "37.5" → "37.5 ETH"
export function formatETH(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "0 ETH"
  return `${num.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`
}

// Format address: "0x1234567890abcdef" → "0x1234...cdef"
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Time remaining: unix timestamp → "7 days", "3 hours", "Ended"
export function timeRemaining(endTimestamp: number): string {
  const now = Date.now()
  const diff = endTimestamp - now

  if (diff <= 0) return "Ended"

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? "" : "s"}`
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`
  return `${seconds} second${seconds === 1 ? "" : "s"}`
}

// Progress percentage: (raised / target) * 100, capped at 100
export function progressPercent(raised: string, target: string): number {
  const raisedNum = parseFloat(raised)
  const targetNum = parseFloat(target)
  if (isNaN(raisedNum) || isNaN(targetNum) || targetNum === 0) return 0
  return Math.min((raisedNum / targetNum) * 100, 100)
}

// Progress color: >66 → green, 33-66 → yellow, <33 → red
export function progressColor(percent: number): string {
  if (percent >= 66) return "#10b981" // emerald-500
  if (percent >= 33) return "#f59e0b" // amber-500
  return "#ef4444" // red-500
}

// Progress color class for Tailwind
export function progressColorClass(percent: number): string {
  if (percent >= 66) return "bg-emerald-500"
  if (percent >= 33) return "bg-amber-500"
  return "bg-red-500"
}

// Format token amount: "240.000000000000000000" → "240"
export function formatTokens(amount: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return "0"
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// Estimate tokens for ETH amount (mock calculation matching contract):
// First 50% of goal = 120 tokens/ETH, rest = 100 tokens/ETH
export function estimateTokens(
  ethAmount: string,
  totalRaised: string,
  targetAmount: string
): string {
  const amount = parseFloat(ethAmount)
  const raised = parseFloat(totalRaised)
  const target = parseFloat(targetAmount)

  if (isNaN(amount) || amount <= 0) return "0"
  if (isNaN(raised) || isNaN(target) || target <= 0) return "0"

  const halfTarget = target / 2
  let tokens = 0
  let remainingAmount = amount

  // If still in bonus phase (first 50%)
  if (raised < halfTarget) {
    const bonusCapacity = halfTarget - raised
    const bonusAmount = Math.min(remainingAmount, bonusCapacity)
    tokens += bonusAmount * 120 // Early bonus rate
    remainingAmount -= bonusAmount
  }

  // Regular rate for remaining
  if (remainingAmount > 0) {
    tokens += remainingAmount * 100
  }

  return tokens.toFixed(0)
}

// Format relative time: timestamp → "2 hours ago", "1 day ago"
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  return "Just now"
}
