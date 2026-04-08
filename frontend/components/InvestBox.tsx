"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Wallet, Info, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ProgressBar"
import { StatusBadge } from "@/components/StatusBadge"
import { formatETH, formatTokens, estimateTokens, progressPercent } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import type { Campaign } from "@/lib/types"
import { toast } from "sonner"

interface InvestBoxProps {
  campaign: Campaign
}

export function InvestBox({ campaign }: InvestBoxProps) {
  const { t } = useLanguage()
  const [amount, setAmount] = useState("")
  
  // TODO: Replace with useAccount() from wagmi
  const isConnected = false
  
  const estimatedTokens = estimateTokens(
    amount,
    campaign.totalRaised,
    campaign.targetAmount
  )
  
  const percent = progressPercent(campaign.totalRaised, campaign.targetAmount)
  const canInvest = campaign.status === "Active" && !campaign.paused

  const handleInvest = () => {
    // TODO: Replace with useWriteContract for invest()
    toast.info("Transaction submitted", {
      description: "Please confirm the transaction in your wallet.",
    })
  }

  return (
    <Card className="bg-[#130f1f] border-fuchsia-500/20 sticky top-24 currents-glow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold currents-text">{t("invest")}</CardTitle>
          <StatusBadge status={campaign.status} paused={campaign.paused} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <ProgressBar
            raised={campaign.totalRaised}
            target={campaign.targetAmount}
            height="lg"
          />
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-fuchsia-400">
              {formatETH(campaign.totalRaised)}
            </span>
            <span className="text-violet-300/60">
              of {formatETH(campaign.targetAmount)} {t("target")}
            </span>
          </div>
          <div className="text-4xl font-bold currents-text text-center py-2">
            {percent.toFixed(0)}%
          </div>
          <div className="flex items-center justify-between text-sm text-violet-300/60">
            <span>{campaign.investorsCount} {t("backers")}</span>
            <span>
              {campaign.status === "Active" 
                ? `${Math.ceil((campaign.endTimestamp - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
                : campaign.status}
            </span>
          </div>
        </div>

        {/* Contribution Limits */}
        <div className="flex items-center justify-between text-sm p-3 bg-[#1e1730] rounded-lg">
          <div className="flex items-center gap-1.5 text-violet-300/60">
            <Info className="w-4 h-4" />
            <span>Limits:</span>
          </div>
          <span className="text-foreground">
            {formatETH(campaign.minContribution)} — {formatETH(campaign.maxContribution)}
          </span>
        </div>

        {/* Investment Form */}
        {canInvest && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("ethToInvest")}
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#1e1730] border-fuchsia-500/20 text-lg focus:border-fuchsia-500/50"
                step="0.01"
                min={campaign.minContribution}
                max={campaign.maxContribution}
              />
              {amount && parseFloat(amount) > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-fuchsia-400"
                >
                  {t("youWillReceive")}: ~{formatTokens(estimatedTokens)} {campaign.token.symbol}
                </motion.p>
              )}
            </div>

            {isConnected ? (
              <Button
                className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:from-fuchsia-600 hover:to-orange-600 text-white font-semibold h-12 border-0"
                onClick={handleInvest}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {t("investNow")}
              </Button>
            ) : (
              <Button
                className="w-full bg-[#1e1730] hover:bg-fuchsia-500/10 text-violet-300 hover:text-fuchsia-400 font-semibold h-12 border border-fuchsia-500/20"
                onClick={() => {
                  // TODO: Open RainbowKit modal
                }}
              >
                <Wallet className="w-5 h-5 mr-2" />
                {t("connectToInvest")}
              </Button>
            )}
          </div>
        )}

        {/* Token Info */}
        <div className="space-y-3 pt-4 border-t border-fuchsia-500/20">
          <h4 className="font-medium text-foreground">{t("tokenInfo")}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-violet-300/60">{t("tokenName")}</span>
              <span className="text-foreground">{campaign.token.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-violet-300/60">{t("tokenSymbol")}</span>
              <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                {campaign.token.symbol}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-violet-300/60">Total Minted</span>
              <span className="text-foreground">{formatTokens(campaign.token.totalMinted)}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-fuchsia-500/20 hover:border-fuchsia-500 text-violet-300 hover:text-fuchsia-400"
            onClick={() => {
              // TODO: Add token to MetaMask
              toast.success("Token added to MetaMask")
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Add to MetaMask
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
