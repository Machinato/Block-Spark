"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Info, Wallet, ArrowLeft, ArrowRight, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StepIndicator } from "@/components/StepIndicator"
import { formatETH } from "@/lib/utils"
import { toast } from "sonner"

const steps = [
  { title: "Details", description: "Campaign information" },
  { title: "Funding", description: "Goals and limits" },
  { title: "Token", description: "Token configuration" },
]

interface FormData {
  name: string; description: string; ipfsHash: string
  targetAmount: string; minContribution: string; maxContribution: string; endDate: string
  tokenName: string; tokenSymbol: string
}

export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: "", description: "", ipfsHash: "",
    targetAmount: "", minContribution: "0.01", maxContribution: "5", endDate: "",
    tokenName: "", tokenSymbol: "",
  })

  const isConnected = false
  const updateField = (field: keyof FormData, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))
  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1) }
  const prevStep = () => { if (currentStep > 0) setCurrentStep((prev) => prev - 1) }
  const handleSubmit = () => toast.info("Transaction submitted", { description: "Please confirm the transaction in your wallet." })

  const daysUntilEnd = formData.endDate
    ? Math.ceil((new Date(formData.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#08080f]">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Create Campaign</h1>
          <p className="text-white/40">Launch your project and let the community fund your vision</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <StepIndicator steps={steps} currentStep={currentStep} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="bg-[#0e0e1a] border-white/5">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">{steps[currentStep].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Campaign Name</label>
                      <Input placeholder="Enter your campaign name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} className="bg-[#161625] border-white/5 text-white placeholder:text-white/20 focus:border-sky-300/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Description</label>
                      <Textarea placeholder="Describe your project..." value={formData.description} onChange={(e) => updateField("description", e.target.value)} className="bg-[#161625] border-white/5 text-white placeholder:text-white/20 min-h-[150px] focus:border-sky-300/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Upload Image</label>
                      <div className="border-2 border-dashed border-white/5 rounded-lg p-8 text-center hover:border-sky-300/20 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/30">Drag and drop an image, or click to browse</p>
                        <p className="text-xs text-white/20 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-white/70">IPFS Hash</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger><Info className="w-4 h-4 text-white/20" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-[#0e0e1a] border-white/10"><p>Upload your campaign details to IPFS and paste the hash here.</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input placeholder="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" value={formData.ipfsHash} onChange={(e) => updateField("ipfsHash", e.target.value)} className="bg-[#161625] border-white/5 text-white font-mono text-sm placeholder:text-white/20 focus:border-sky-300/30" />
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Target Amount (ETH)</label>
                      <div className="relative">
                        <Input type="number" placeholder="50" value={formData.targetAmount} onChange={(e) => updateField("targetAmount", e.target.value)} className="bg-[#161625] border-white/5 text-white pr-14 focus:border-sky-300/30" step="0.1" min="0" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">ETH</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Min Contribution</label>
                        <div className="relative">
                          <Input type="number" placeholder="0.01" value={formData.minContribution} onChange={(e) => updateField("minContribution", e.target.value)} className="bg-[#161625] border-white/5 text-white pr-14 focus:border-sky-300/30" step="0.01" min="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">ETH</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Max Contribution</label>
                        <div className="relative">
                          <Input type="number" placeholder="5" value={formData.maxContribution} onChange={(e) => updateField("maxContribution", e.target.value)} className="bg-[#161625] border-white/5 text-white pr-14 focus:border-sky-300/30" step="0.1" min="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">ETH</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">End Date</label>
                      <Input type="date" value={formData.endDate} onChange={(e) => updateField("endDate", e.target.value)} className="bg-[#161625] border-white/5 text-white focus:border-sky-300/30" min={new Date().toISOString().split("T")[0]} />
                      {formData.endDate && daysUntilEnd > 0 && (
                        <p className="text-sm text-sky-300/70">Campaign ends in {daysUntilEnd} days</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Token Name</label>
                      <Input placeholder="My Project Token" value={formData.tokenName} onChange={(e) => updateField("tokenName", e.target.value)} className="bg-[#161625] border-white/5 text-white placeholder:text-white/20 focus:border-sky-300/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Token Symbol</label>
                      <Input placeholder="MPT" value={formData.tokenSymbol} onChange={(e) => updateField("tokenSymbol", e.target.value.toUpperCase().slice(0, 5))} className="bg-[#161625] border-white/5 text-white uppercase focus:border-sky-300/30" maxLength={5} />
                      <p className="text-xs text-white/30">Maximum 5 characters, uppercase</p>
                    </div>

                    {(formData.tokenName || formData.tokenSymbol) && (
                      <div className="p-4 bg-[#161625] rounded-lg">
                        <p className="text-sm text-white/40 mb-2">Token Preview</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sky-300/10 flex items-center justify-center">
                            <span className="text-sky-300 font-bold text-sm">{formData.tokenSymbol?.slice(0, 2) || "??"}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{formData.tokenName || "Token Name"}</p>
                            <Badge variant="outline" className="border-sky-300/30 text-sky-300 text-xs">{formData.tokenSymbol || "SYM"}</Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-sky-300/5 border border-sky-300/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-sky-300/60 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-sky-300/60">
                          <p className="font-medium mb-1">Token Distribution</p>
                          <p>100 tokens per ETH (120 tokens for first 50% of goal - early investor bonus!)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#161625] rounded-lg space-y-3">
                      <p className="text-sm font-medium text-white/70">Campaign Summary</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-white/30">Campaign</span><span className="text-white">{formData.name || "-"}</span></div>
                        <div className="flex justify-between"><span className="text-white/30">Goal</span><span className="text-white">{formData.targetAmount ? formatETH(formData.targetAmount) : "-"} {formData.endDate ? `by ${new Date(formData.endDate).toLocaleDateString()}` : ""}</span></div>
                        <div className="flex justify-between"><span className="text-white/30">Token</span><span className="text-white">{formData.tokenSymbol || "-"} - 100 per ETH</span></div>
                        <div className="flex justify-between pt-2 border-t border-white/5"><span className="text-white/30">Estimated gas</span><span className="text-white">~0.002 ETH</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="border-white/10 text-white/50 hover:bg-white/5 rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button onClick={nextStep} className="prism-button rounded-full border-0">
                    Next<ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : isConnected ? (
                  <Button onClick={handleSubmit} className="prism-button rounded-full border-0">
                    <Rocket className="w-4 h-4 mr-2" />Launch Campaign
                  </Button>
                ) : (
                  <Button className="bg-white/5 hover:bg-white/10 text-white/60 font-semibold rounded-full" onClick={() => { }}>
                    <Wallet className="w-4 h-4 mr-2" />Connect Wallet to Launch
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}