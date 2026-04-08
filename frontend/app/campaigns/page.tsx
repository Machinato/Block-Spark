"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignGrid } from "@/components/CampaignGrid"
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"
import { useLanguage } from "@/lib/language-context"
import type { CampaignStatus } from "@/lib/types"

type FilterStatus = "All" | CampaignStatus

export default function CampaignsPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All")
  const [sortBy, setSortBy] = useState("most-funded")
  const [isLoading] = useState(false)

  const campaigns = MOCK_CAMPAIGNS

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case "most-funded": return parseFloat(b.totalRaised) - parseFloat(a.totalRaised)
      case "ending-soon": return a.endTimestamp - b.endTimestamp
      case "newest": return b.endTimestamp - a.endTimestamp
      default: return 0
    }
  })

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#08080f] relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-sky-300/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-sky-500/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("allCampaigns")}</h1>
          <p className="text-white/40 max-w-2xl mx-auto">{t("featuredDescription")}</p>
        </motion.div>

        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#0e0e1a] border-white/5 h-11 text-white placeholder:text-white/20 focus:border-sky-300/30"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#0e0e1a] border-white/5 h-11 text-white/60">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0e0e1a] border-white/10">
                <SelectItem value="most-funded">{t("sortMostFunded")}</SelectItem>
                <SelectItem value="ending-soon">{t("sortEndingSoon")}</SelectItem>
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <TabsList className="bg-[#0e0e1a] border border-white/5 h-11">
              <TabsTrigger value="All" className="data-[state=active]:prism-button data-[state=active]:text-[#08080f] text-white/40">
                {t("filterAll")}
              </TabsTrigger>
              <TabsTrigger value="Active" className="data-[state=active]:prism-button data-[state=active]:text-[#08080f] text-white/40">
                {t("filterActive")}
              </TabsTrigger>
              <TabsTrigger value="Successful" className="data-[state=active]:prism-button data-[state=active]:text-[#08080f] text-white/40">
                {t("filterSuccessful")}
              </TabsTrigger>
              <TabsTrigger value="Failed" className="data-[state=active]:prism-button data-[state=active]:text-[#08080f] text-white/40">
                {t("filterFailed")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <CampaignGrid campaigns={sortedCampaigns} isLoading={isLoading} />

        <motion.div
          className="flex items-center justify-center gap-4 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button variant="outline" disabled className="border-white/5 text-white/20 rounded-full">Previous</Button>
          <span className="text-sm text-white/30">Page 1 of 1</span>
          <Button variant="outline" disabled className="border-white/5 text-white/20 rounded-full">Next</Button>
        </motion.div>
      </div>
    </div>
  )
}