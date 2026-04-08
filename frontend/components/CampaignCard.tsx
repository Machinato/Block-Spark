"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Users, Coins } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/StatusBadge"
import { ProgressBar } from "@/components/ProgressBar"
import { TimeRemaining } from "@/components/TimeRemaining"
import { formatETH } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import type { Campaign } from "@/lib/types"

interface CampaignCardProps {
  campaign: Campaign
  index?: number
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const { t } = useLanguage()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group"
    >
      <Card className="bg-[#130f1f] border-fuchsia-500/20 overflow-hidden transition-all duration-300 group-hover:border-fuchsia-500/50 currents-glow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
              {campaign.name}
            </h3>
            <StatusBadge status={campaign.status} paused={campaign.paused} />
          </div>
          <p className="text-sm text-violet-300/60 line-clamp-2 mt-1">
            {campaign.description}
          </p>
        </CardHeader>
        <CardContent className="pb-3">
          <ProgressBar
            raised={campaign.totalRaised}
            target={campaign.targetAmount}
            height="sm"
            className="mb-3"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-fuchsia-400 font-medium">
              {formatETH(campaign.totalRaised)}
            </span>
            <span className="text-violet-300/60">
              of {formatETH(campaign.targetAmount)}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-violet-300/60">
                <Users className="w-4 h-4" />
                <span>{campaign.investorsCount}</span>
              </div>
              <TimeRemaining endTimestamp={campaign.endTimestamp} />
            </div>
            <Badge
              variant="outline"
              className="text-xs border-orange-500/50 text-orange-400"
            >
              <Coins className="w-3 h-3 mr-1" />
              {campaign.token.symbol}
            </Badge>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full border-fuchsia-500/30 text-violet-300 hover:border-fuchsia-500 hover:text-fuchsia-400 transition-colors"
          >
            <Link href={`/campaigns/${campaign.id}`}>{t("viewCampaign")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
