"use client"

import { Search } from "lucide-react"
import { CampaignCard } from "@/components/CampaignCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/lib/language-context"
import type { Campaign } from "@/lib/types"

interface CampaignGridProps {
  campaigns: Campaign[]
  isLoading?: boolean
}

function CampaignSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-3/4 bg-muted" />
        <Skeleton className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <Skeleton className="h-4 w-full bg-muted" />
      <Skeleton className="h-4 w-2/3 bg-muted" />
      <Skeleton className="h-2 w-full rounded-full bg-muted" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 bg-muted" />
        <Skeleton className="h-4 w-20 bg-muted" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12 bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full bg-muted" />
      </div>
      <Skeleton className="h-10 w-full rounded-md bg-muted" />
    </div>
  )
}

export function CampaignGrid({ campaigns, isLoading = false }: CampaignGridProps) {
  const { t } = useLanguage()
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-prism-from/20 to-prism-to/20 flex items-center justify-center mb-4">
          <Search className="w-10 h-10 text-prism-from" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("noCampaigns")}
        </h3>
        <p className="text-muted-foreground">
          {t("noCampaignsDesc")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign, index) => (
        <CampaignCard key={campaign.id} campaign={campaign} index={index} />
      ))}
    </div>
  )
}
