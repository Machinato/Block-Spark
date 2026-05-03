"use client"

import { use } from "react"
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
import { useAccount } from "wagmi"

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Using React.use to unwrap params without making the Client Component async, 
  // which prevents Next.js SSR errors while adhering to the instruction intent.
  const resolvedParams = use(params)
  const profileId = resolvedParams.id
  
  const { address, isConnected } = useAccount()
  const isOwner = isConnected && address?.toLowerCase() === profileId.toLowerCase()

  const participations = MOCK_PARTICIPATIONS
  const userCampaigns = MOCK_CAMPAIGNS.filter((c) => c.creator.toLowerCase() === profileId.toLowerCase())
  const totalInvested = participations.reduce((sum, p) => sum + Number(p.totalContributed), 0)
  const totalTokens = participations.reduce((sum, p) => sum + Number(p.tokenRewards), 0)
  const totalRaised = userCampaigns.reduce((sum, c) => sum + Number(c.totalRaised), 0)

  const copyAddress = () => { navigator.clipboard.writeText(profileId); toast.success("Address copied") }
  const handleClaimTokens = (name: string) => toast.success("Tokens claimed!", { description: `Tokens from ${name} sent to your wallet.` })
  const handleClaimRefund = (name: string) => toast.success("Refund claimed!", { description: `Your ETH from ${name} has been returned.` })

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-prism-from/10 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-prism-from/70" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
              <button onClick={copyAddress} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <span className="font-mono">{shortenAddress(profileId)}</span>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isOwner && (
            <Button asChild className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground border-0 hover:opacity-90 rounded-full font-semibold">
              <Link href="/create">Create Campaign</Link>
            </Button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Tabs defaultValue="investments" className="space-y-8">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="investments" className="data-[state=active]:bg-prism-from/10 data-[state=active]:text-prism-from text-muted-foreground">My Investments</TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-prism-from/10 data-[state=active]:text-prism-from text-muted-foreground">My Campaigns</TabsTrigger>
            </TabsList>

            <TabsContent value="investments" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Coins, label: "Total Invested", value: `${totalInvested.toFixed(1)} ETH` },
                  { icon: TrendingUp, label: "Campaigns Backed", value: participations.length },
                  { icon: Coins, label: "Tokens Earned", value: formatTokens(totalTokens.toString()) },
                ].map((stat, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-prism-from/10 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-prism-from/60" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold text-foreground">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {participations.length > 0 ? (
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle className="text-lg font-semibold text-foreground">Investment History</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Campaign</TableHead>
                            <TableHead className="text-muted-foreground">Contributed</TableHead>
                            <TableHead className="text-muted-foreground">Tokens</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participations.map((p) => (
                            <TableRow key={p.id} className="border-border">
                              <TableCell>
                                <Link href={`/campaigns/${p.campaign.id}`} className="font-medium text-foreground hover:text-prism-from transition-colors">{p.campaign.name}</Link>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatETH(p.totalContributed)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground">{formatTokens(p.tokenRewards)}</span>
                                  <Badge variant="outline" className="border-prism-from/20 text-prism-from/80 text-xs">{p.campaign.token.symbol}</Badge>
                                </div>
                              </TableCell>
                              <TableCell><StatusBadge status={p.campaign.status} /></TableCell>
                              <TableCell className="text-right">
                                {!isOwner ? (
                                  <span className="text-muted-foreground/50 text-sm">-</span>
                                ) : (
                                  <>
                                    {p.campaign.status === "Successful" && !p.tokensClaimed && (
                                      <Button size="sm" className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground border-0 hover:opacity-90 rounded-full text-xs font-semibold" onClick={() => handleClaimTokens(p.campaign.name)}>Claim Tokens</Button>
                                    )}
                                    {p.campaign.status === "Failed" && !p.refunded && (
                                      <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-full text-xs" onClick={() => handleClaimRefund(p.campaign.name)}>Claim Refund</Button>
                                    )}
                                    {(p.campaign.status === "Active" || p.tokensClaimed || p.refunded) && (
                                      <span className="text-muted-foreground/50 text-sm">-</span>
                                    )}
                                  </>
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
                <Card className="bg-card border-border">
                  <CardContent className="py-16 text-center">
                    <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Investments Yet</h3>
                    <p className="text-muted-foreground mb-6">Explore campaigns and start backing projects you believe in.</p>
                    <Button asChild className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground border-0 hover:opacity-90 rounded-full font-semibold"><Link href="/campaigns">Explore Campaigns</Link></Button>
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
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-prism-from/10 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-prism-from/60" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold text-foreground">{stat.value}</p>
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
                <Card className="bg-card border-border">
                  <CardContent className="py-16 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Campaigns Created</h3>
                    <p className="text-muted-foreground mb-6">Launch your first campaign and let the community fund your vision.</p>
                    {isOwner && (
                      <Button asChild className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground border-0 hover:opacity-90 rounded-full font-semibold"><Link href="/create">Create Campaign</Link></Button>
                    )}
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