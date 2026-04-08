import { Badge } from "@/components/ui/badge"
import type { CampaignStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: CampaignStatus
  paused?: boolean
  className?: string
}

const statusStyles: Record<CampaignStatus, string> = {
  Active: "border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-500/10",
  Successful: "bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white border-transparent",
  Failed: "border-pink-500/50 text-pink-400 bg-pink-500/10",
  Finished: "bg-violet-600/50 text-violet-300 border-violet-500/50",
}

export function StatusBadge({ status, paused, className }: StatusBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn("text-xs font-medium", statusStyles[status])}
      >
        {status}
      </Badge>
      {paused && (
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-500 bg-amber-500/10 text-xs font-medium"
        >
          Paused
        </Badge>
      )}
    </div>
  )
}
