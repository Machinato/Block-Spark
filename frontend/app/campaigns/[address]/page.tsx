"use client"

import { use } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatusBadge } from "@/components/StatusBadge"
import { InvestBox } from "@/components/InvestBox"
import { ContributionFeed } from "@/components/ContributionFeed"
import {
  MOCK_CAMPAIGNS,
  MOCK_CONTRIBUTIONS,
  MOCK_CAMPAIGN_FULL_DESCRIPTION,
} from "@/lib/mock-data"
import { formatTokens } from "@/lib/utils"
import { toast } from "sonner"

interface CampaignPageProps {
  params: Promise<{ address: string }>
}

export default function CampaignDetailPage({ params }: CampaignPageProps) {
  const { address } = use(params)
  
  // TODO: Replace with useReadContract or GraphQL query
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === address) || MOCK_CAMPAIGNS[0]
  const contributions = MOCK_CONTRIBUTIONS

  // Mock states for demonstration
  // TODO: Replace with actual wallet connection check
  const isConnected = false
  const isCreator = false
  const hasInvested = true // Mock: user has invested
  const userTokens = "240" // Mock: user's token rewards

  const handleClaimTokens = () => {
    // TODO: Replace with useWriteContract for claimTokens()
    toast.success("Tokens claimed successfully!", {
      description: `${formatTokens(userTokens)} ${campaign.token.symbol} tokens have been sent to your wallet.`,
    })
  }

  const handleClaimRefund = () => {
    // TODO: Replace with useWriteContract for claimRefund()
    toast.success("Refund claimed successfully!", {
      description: "Your ETH has been returned to your wallet.",
    })
  }

  const handleClaimFunds = () => {
    // TODO: Replace with useWriteContract for claimFunds()
    toast.success("Funds claimed successfully!", {
      description: "Campaign funds have been sent to your wallet.",
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            asChild
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <Link href="/campaigns">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {campaign.name}
                </h1>
                <StatusBadge status={campaign.status} paused={campaign.paused} />
              </div>
              <p className="text-muted-foreground text-lg">
                {campaign.description}
              </p>
            </motion.div>

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    About this Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    {MOCK_CAMPAIGN_FULL_DESCRIPTION.split("\n\n").map(
                      (paragraph, index) => (
                        <p
                          key={index}
                          className="text-muted-foreground mb-4 last:mb-0 whitespace-pre-line"
                        >
                          {paragraph}
                        </p>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Status Alerts */}
            {hasInvested && campaign.status === "Failed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <AlertTitle className="text-amber-500">
                    Campaign Did Not Reach Goal
                  </AlertTitle>
                  <AlertDescription className="text-amber-500/80">
                    This campaign did not reach its funding goal. You can claim
                    a refund for your contribution.
                  </AlertDescription>
                  <Button
                    onClick={handleClaimRefund}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    Claim Refund
                  </Button>
                </Alert>
              </motion.div>
            )}

            {hasInvested &&
              (campaign.status === "Successful" ||
                campaign.status === "Finished") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <Alert className="border-emerald-500/50 bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <AlertTitle className="text-emerald-500">
                      Congratulations!
                    </AlertTitle>
                    <AlertDescription className="text-emerald-500/80">
                      You can claim your token rewards. You have{" "}
                      <strong>
                        {formatTokens(userTokens)} {campaign.token.symbol}
                      </strong>{" "}
                      tokens waiting for you.
                    </AlertDescription>
                    <Button
                      onClick={handleClaimTokens}
                      className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                    >
                      Claim Tokens
                    </Button>
                  </Alert>
                </motion.div>
              )}

            {/* Creator Actions */}
            {isCreator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Creator Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                    {campaign.status === "Successful" && !campaign.fundsClaimed && (
                      <Button
                        onClick={handleClaimFunds}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                      >
                        Claim Funds
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-border"
                      onClick={() => {
                        // TODO: Replace with useWriteContract for pause/unpause
                        toast.info(
                          campaign.paused
                            ? "Campaign unpaused"
                            : "Campaign paused"
                        )
                      }}
                    >
                      {campaign.paused ? "Unpause Campaign" : "Pause Campaign"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Contributions Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <ContributionFeed
                contributions={contributions}
                tokenSymbol={campaign.token.symbol}
              />
            </motion.div>
          </div>

          {/* Right Column - Invest Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <InvestBox campaign={campaign} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
