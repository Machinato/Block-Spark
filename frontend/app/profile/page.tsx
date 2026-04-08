"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Wallet, Coins, TrendingUp, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/StatusBadge"
import { CampaignCard } from "@/components/CampaignCard"
import { shortenAddress, formatETH, formatTokens } from "@/lib/utils"
import { MOCK_PARTICIPATIONS, MOCK_CAMPAIGNS } from "@/lib/mock-data"
import { toast } from "sonner"

export default function ProfilePage() {
  const isConnected = true
  const address = "0x1234567890abcdef1234567890abcdef12345678"
  const participations = MOCK_PARTICIPATIONS
  const userCampaigns = MOCK_CAMPAIGNS.filter((c) => c.creator === "0xabcdef1234567890abcdef1234567890abcdef12")
  const totalInvested = participations.reduce((sum, p) => sum + parseFloat(p.totalContributed), 0)
  const totalTokens = participations.reduce((sum, p) => sum + parseFloat(p.tokenRewards), 0)
  const totalRaised = userCampaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0)

  const copyAddress = () => { navigator.clipboard.writeText(address); toast.success("Address copied") }
  const handleClaimTokens = (name: string) => toast.success("Tokens claimed!", { description: `Tokens from ${name} sent to your wallet.` })
  const handleClaimRefund = (name: string) => toast.success("Refund claimed!", { description: `Your ETH from ${name} has been returned.` })

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#08080f]">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>
          <p className="text-white/40 mb-6">Connect your wallet to view your profile</p>
          <Button className="prism-button rounded-full border-0" onClick={() => { }}>Connect Wallet</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#08080f]">
      <div className="container mx-auto px-4">
        <motion.div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sky-300/10 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-sky-300/70" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <button onClick={copyAddress} className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
                <span className="font-mono">{shortenAddress(address)}</span>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button asChild className="prism-button rounded-full border-0">
            <Link href="/create">Create Campaign</Link>
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Tabs defaultValue="investments" className="space-y-8">
            <TabsList className="bg-[#0e0e1a] border border-white/5">
              <TabsTrigger value="investments" className="data-[state=active]:bg-sky-300/20 data-[state=active]:text-sky-300 text-white/40">My Investments</TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-sky-300/20 data-[state=active]:text-sky-300 text-white/40">My Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="investments" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Coins, label: "Total Invested", value: `${totalInvested.toFixed(1)} ETH` },
                  { icon: TrendingUp, label: "Campaigns Backed", value: participations.length },
                  { icon: Coins, label: "Tokens Earned", value: formatTokens(totalTokens.toString()) },
                ].map((stat, i) => (
                  <Card key={i} className="bg-[#0e0e1a] border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-300/5 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-sky-300/60" />
                        </div>
                        <div>
                          <p className="text-sm text-white/30">{stat.label}</p>
                          <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {participations.length > 0 ? (
                <Card className="bg-[#0e0e1a] border-white/5">
                  <CardHeader><CardTitle className="text-lg font-semibold text-white">Investment History</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/5">
                            <TableHead className="text-white/30">Campaign</TableHead>
                            <TableHead className="text-white/30">Contributed</TableHead>
                            <TableHead className="text-white/30">Tokens</TableHead>
                            <TableHead className="text-white/30">Status</TableHead>
                            <TableHead className="text-right text-white/30">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participations.map((p) => (
                            <TableRow key={p.id} className="border-white/5">
                              <TableCell>
                                <Link href={`/campaigns/${p.campaign.id}`} className="font-medium text-white hover:text-sky-300 transition-colors">{p.campaign.name}</Link>
                              </TableCell>
                              <TableCell className="text-white/60">{formatETH(p.totalContributed)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white/60">{formatTokens(p.tokenRewards)}</span>
                                  <Badge variant="outline" className="border-sky-300/20 text-sky-300/60 text-xs">{p.campaign.token.symbol}</Badge>
                                </div>
                              </TableCell>
                              <TableCell><StatusBadge status={p.campaign.status} /></TableCell>
                              <TableCell className="text-right">
                                {p.campaign.status === "Successful" && !p.tokensClaimed && (
                                  <Button size="sm" className="prism-button rounded-full border-0 text-xs" onClick={() => handleClaimTokens(p.campaign.name)}>Claim Tokens</Button>
                                )}
                                {p.campaign.status === "Failed" && !p.refunded && (
                                  <Button size="sm" variant="outline" className="border-white/10 text-white/40 hover:bg-white/5 rounded-full text-xs" onClick={() => handleClaimRefund(p.campaign.name)}>Claim Refund</Button>
                                )}
                                {(p.campaign.status === "Active" || p.tokensClaimed || p.refunded) && (
                                  <span className="text-white/20 text-sm">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[#0e0e1a] border-white/5">
                  <CardContent className="py-16 text-center">
                    <Coins className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Investments Yet</h3>
                    <p className="text-white/30 mb-6">Explore campaigns and start backing projects you believe in.</p>
                    <Button asChild className="prism-button rounded-full border-0"><Link href="/campaigns">Explore Campaigns</Link></Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: TrendingUp, label: "Total Campaigns", value: userCampaigns.length },
                  { icon: Coins, label: "Total Raised", value: `${totalRaised.toFixed(1)} ETH` },
                ].map((stat, i) => (
                  <Card key={i} className="bg-[#0e0e1a] border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-300/5 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-sky-300/60" />
                        </div>
                        <div>
                          <p className="text-sm text-white/30">{stat.label}</p>
                          <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {userCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCampaigns.map((campaign, index) => <CampaignCard key={campaign.id} campaign={campaign} index={index} />)}
                </div>
              ) : (
                <Card className="bg-[#0e0e1a] border-white/5">
                  <CardContent className="py-16 text-center">
                    <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Campaigns Created</h3>
                    <p className="text-white/30 mb-6">Launch your first campaign and let the community fund your vision.</p>
                    <Button asChild className="prism-button rounded-full border-0"><Link href="/create">Create Campaign</Link></Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}