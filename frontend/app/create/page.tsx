"use client"

import { motion } from "framer-motion"
import { CreateCampaignForm } from "@/components/CreateCampaignForm"

export default function CreateCampaignPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Create Campaign</h1>
          <p className="text-muted-foreground">Launch your project and let the community fund your vision</p>
        </motion.div>

        <CreateCampaignForm />
      </div>
    </div>
  )
}