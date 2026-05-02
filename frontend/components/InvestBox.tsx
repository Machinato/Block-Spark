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
import { StatCard } from "@/components/StatCard"
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
    <Card className="bg-card border-border sticky top-24 prism-glow hover:border-prism-from/30 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{t("invest")}</CardTitle>
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
            <span className="text-2xl font-bold text-prism-from">
              {formatETH(campaign.totalRaised)}
            </span>
            <span className="text-muted-foreground">
              of {formatETH(campaign.targetAmount)} {t("target")}
            </span>
          </div>
          <StatCard 
            label="Funded"
            value={percent.toFixed(0)}
            suffix="%"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{campaign.investorsCount} {t("backers")}</span>
            <span>
              {campaign.status === "Active" 
                ? `${Math.ceil((campaign.endTimestamp - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
                : campaign.status}
            </span>
          </div>
        </div>

        {/* Contribution Limits */}
        <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground">
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
                className="bg-muted border-border text-lg focus:border-prism-from/50 focus:ring-prism-from/30"
                step="0.01"
                min={Number(campaign.minContribution)}
                max={Number(campaign.maxContribution)}
              />
              {amount && parseFloat(amount) > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-prism-from"
                >
                  {t("youWillReceive")}: ~{formatTokens(estimatedTokens)} {campaign.token.symbol}
                </motion.p>
              )}
            </div>

            {isConnected ? (
              <Button
                className="w-full bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground hover:opacity-90 font-semibold h-12 border-0"
                onClick={handleInvest}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {t("investNow")}
              </Button>
            ) : (
              <Button
                className="w-full bg-muted hover:bg-prism-from/10 text-muted-foreground hover:text-prism-from font-semibold h-12 border border-border"
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
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="font-medium text-foreground">{t("tokenInfo")}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tokenName")}</span>
              <span className="text-foreground">{campaign.token.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tokenSymbol")}</span>
              <Badge variant="outline" className="border-prism-to/50 text-prism-to">
                {campaign.token.symbol}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Minted</span>
              <span className="text-foreground">{formatTokens(campaign.token.totalMinted)}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border hover:border-prism-from text-muted-foreground hover:text-prism-from"
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
