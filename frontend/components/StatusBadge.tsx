import { Badge } from "@/components/ui/badge"
import type { CampaignStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
    status: CampaignStatus
    paused?: boolean
    className?: string
}

const statusStyles: Record<CampaignStatus, string> = {
    Active: "border-prism-from/40 text-prism-from bg-prism-from/10",
    Successful: "border-prism-to/40 text-prism-to bg-prism-to/10",
    Failed: "border-border text-muted-foreground bg-muted",
    Finished: "border-border text-muted-foreground bg-muted",
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
                    className="border-destructive text-destructive bg-destructive/10 text-xs font-medium"
                >
                    Paused
                </Badge>
            )}
        </div>
    )
}