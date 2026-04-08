"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { shortenAddress, formatETH, formatTokens, formatRelativeTime } from "@/lib/utils"
import type { Contribution } from "@/lib/types"

interface ContributionFeedProps {
  contributions: Contribution[]
  tokenSymbol: string
}

export function ContributionFeed({
  contributions,
  tokenSymbol,
}: ContributionFeedProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Contributions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contributions.map((contribution, index) => (
          <motion.div
            key={contribution.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm text-emerald-500">
                {shortenAddress(contribution.investor)}
              </span>
              <span className="text-muted-foreground text-sm">contributed</span>
              <span className="font-medium text-foreground">
                {formatETH(contribution.amount)}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground hidden sm:block">
                received {formatTokens(contribution.tokenRewardsAfter)} {tokenSymbol}
              </span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(contribution.timestamp)}
            </span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
