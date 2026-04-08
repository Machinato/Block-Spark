"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Rocket, Coins, Gift, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampaignCard } from "@/components/CampaignCard"
import { StatCard } from "@/components/StatCard"
import { MOCK_CAMPAIGNS, MOCK_PLATFORM_STATS } from "@/lib/mock-data"
import { useLanguage } from "@/lib/language-context"
import BlocksparkScene from "@/components/prism/BlocksparkScene"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
}

export default function HomePage() {
  const { t } = useLanguage()
  const featuredCampaigns = MOCK_CAMPAIGNS.slice(0, 3)

  const steps = [
    { icon: Rocket, title: t("step1Title"), description: t("step1Desc") },
    { icon: Coins, title: t("step2Title"), description: t("step2Desc") },
    { icon: Gift, title: t("step3Title"), description: t("step3Desc") },
  ]

  return (
    <div className="min-h-screen">

      {/* Призма — 300vh sticky */}
      <section className="relative" style={{ height: '300vh' }}>
        <div className="sticky top-0 h-screen w-full">
          <BlocksparkScene
            lighting="default"
            className=""
            style={{ width: '100%', height: '100%' }}
          />
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-1 h-2 rounded-full bg-white/30" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#08080f]">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-300/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto px-4 pt-20 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div className="flex justify-center mb-6" variants={fadeInUp}>
              <div className="relative">
                <Zap className="w-10 h-10 text-sky-300 fill-sky-300/20 animate-float" />
                <div className="absolute inset-0 bg-sky-300/20 blur-xl" />
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance"
              variants={fadeInUp}
            >
              {t("heroTitle")}{" "}
              <span className="prism-text">{t("heroTitleAccent")}</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-white/50 mb-8 max-w-2xl mx-auto text-pretty"
              variants={fadeInUp}
            >
              {t("heroSubtitle")}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              variants={fadeInUp}
            >
              <Button
                asChild
                size="lg"
                className="prism-button h-12 px-8 rounded-full border-0"
              >
                <Link href="/campaigns">
                  {t("exploreCampaigns")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20 h-12 px-8 rounded-full"
              >
                <Link href="/create">{t("launchCampaign")}</Link>
              </Button>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              variants={fadeInUp}
            >
              <StatCard label={t("totalRaised")} value={parseFloat(MOCK_PLATFORM_STATS.totalRaisedETH)} suffix=" ETH" decimals={1} />
              <StatCard label={t("activeCampaigns")} value={MOCK_PLATFORM_STATS.totalActiveCampaigns} />
              <StatCard label={t("totalInvestors")} value={MOCK_PLATFORM_STATS.totalInvestors} />
              <StatCard label={t("successfulCampaigns")} value={MOCK_PLATFORM_STATS.totalSuccessful} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-[#08080f] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/3 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("featuredCampaigns")}</h2>
            <p className="text-white/40 max-w-2xl mx-auto">{t("featuredDescription")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredCampaigns.map((campaign, index) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={index} />
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/10 text-white/50 hover:border-sky-300/30 hover:text-sky-300 rounded-full"
            >
              <Link href="/campaigns">
                {t("viewAllCampaigns")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-[#0e0e1a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-sky-300/3 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-500/3 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("howItWorksTitle")}</h2>
            <p className="text-white/40 max-w-2xl mx-auto">{t("howItWorksSubtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative p-8 rounded-2xl bg-[#08080f] border border-white/5 text-center group hover:border-sky-300/20 transition-all duration-300 prism-glow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full prism-button text-[#08080f] font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <div className="w-16 h-16 rounded-xl bg-sky-300/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-300/10 transition-colors">
                  <step.icon className="w-8 h-8 text-sky-300/70" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-20 bg-[#08080f] relative">
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("platformStats")}</h2>
            <p className="text-white/40">{t("platformStatsSubtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            <StatCard label={t("totalCampaigns")} value={MOCK_PLATFORM_STATS.totalCampaigns} />
            <StatCard label={t("activeNow")} value={MOCK_PLATFORM_STATS.totalActiveCampaigns} />
            <StatCard label={t("successful")} value={MOCK_PLATFORM_STATS.totalSuccessful} />
            <StatCard label={t("totalRaised")} value={parseFloat(MOCK_PLATFORM_STATS.totalRaisedETH)} suffix=" ETH" decimals={1} />
            <StatCard label={t("investors")} value={MOCK_PLATFORM_STATS.totalInvestors} />
            <StatCard label={t("creators")} value={MOCK_PLATFORM_STATS.totalCreators} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0e0e1a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-sky-300/5 rounded-full blur-3xl animate-pulse-glow" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("ctaTitle")}</h2>
            <p className="text-white/40 mb-8 max-w-xl mx-auto">{t("ctaSubtitle")}</p>
            <Button
              asChild
              size="lg"
              className="prism-button h-12 px-8 border-0 rounded-full prism-glow-strong"
            >
              <Link href="/create">
                {t("startCampaign")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}