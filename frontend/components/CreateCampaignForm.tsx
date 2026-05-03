"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Info, Wallet, ArrowLeft, ArrowRight, Rocket, Image as ImageIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { parseEther } from "viem"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { StepIndicator } from "@/components/StepIndicator"
import { formatETH } from "@/lib/utils"
import { toast } from "sonner"

// Web3 Precision Security: Validate numeric strings are parsable to Wei > 0
const etherStringValidation = z.string()
  .refine((val) => val !== "", "Amount is required")
  .refine((val) => {
    try {
      const parsed = parseEther(val || "0");
      return parsed > 0n;
    } catch {
      return false;
    }
  }, "Must be a valid positive amount");

// Step 1: Details
const step1Schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageFile: z.any()
    .refine((file) => file !== undefined && file !== null, "Image is required")
    .refine((file) => file?.size <= 5 * 1024 * 1024, "Max file size is 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file?.type),
      "Only .jpg, .png, and .webp formats are supported"
    ),
});

// Step 2: Funding
const step2Schema = z.object({
  targetAmount: etherStringValidation,
  minContribution: etherStringValidation,
  maxContribution: etherStringValidation,
  endDate: z.string()
    .refine((val) => val !== "", "End date is required")
    .refine((val) => new Date(val).getTime() > Date.now(), "Deadline must be in the future"),
});

// Step 3: Token
const step3Schema = z.object({
  tokenName: z.string().min(2, "Token name is required"),
  tokenSymbol: z.string().min(2, "Symbol is required").max(5, "Max 5 characters"),
});

// Combined schema for final submission and cross-validation
const formSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
}).superRefine((data, ctx) => {
  if (!data.minContribution || !data.maxContribution || !data.targetAmount) return;

  try {
    const min = parseEther(data.minContribution);
    const max = parseEther(data.maxContribution);
    const target = parseEther(data.targetAmount);

    if (min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Min contribution cannot exceed Max contribution",
        path: ["minContribution"],
      });
    }
    if (max > target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max contribution cannot exceed Target amount",
        path: ["maxContribution"],
      });
    }
  } catch (e) {
    // Parsing errors are caught by individual field validations
  }
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { title: "Details", description: "Campaign information", fields: ["name", "description", "imageFile"] },
  { title: "Funding", description: "Goals and limits", fields: ["targetAmount", "minContribution", "maxContribution", "endDate"] },
  { title: "Token", description: "Token configuration", fields: ["tokenName", "tokenSymbol"] },
];

export function CreateCampaignForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // TODO: Implement Wagmi useAccount
  const isConnected = false

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      targetAmount: "",
      minContribution: "0.01",
      maxContribution: "5",
      endDate: "",
      tokenName: "",
      tokenSymbol: "",
    },
    mode: "onChange",
  })

  type FieldName = keyof FormValues

  const nextStep = async () => {
    const fields = steps[currentStep].fields as FieldName[]
    const isStepValid = await form.trigger(fields)
    if (isStepValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const onSubmit = async (data: FormValues) => {
    // TODO: IPFS Upload Logic Here (upload data.imageFile and metadata)
    toast.info("Uploading to IPFS...", { description: "Preparing metadata for IPFS network." })
    
    // TODO: Implement Wagmi useWriteContract
    toast.success("Transaction submitted", { description: "Please confirm the transaction in your wallet." })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue("imageFile", file, { shouldValidate: true })
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  const endDateVal = form.watch("endDate")
  const daysUntilEnd = endDateVal
    ? Math.ceil((new Date(endDateVal).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const watchTokenName = form.watch("tokenName")
  const watchTokenSymbol = form.watch("tokenSymbol")

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <StepIndicator steps={steps.map(s => ({ title: s.title, description: s.description }))} currentStep={currentStep} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-card border-border mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your campaign name" {...field} className="bg-background border-border text-foreground focus:border-prism-from/50" />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your project..." {...field} className="bg-background border-border text-foreground min-h-[150px] focus:border-prism-from/50" />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="imageFile"
                        render={() => (
                          <FormItem>
                            <FormLabel>Upload Image</FormLabel>
                            <FormControl>
                              <div>
                                <input
                                  type="file"
                                  accept="image/jpeg, image/png, image/webp"
                                  className="hidden"
                                  ref={fileInputRef}
                                  onChange={handleImageChange}
                                />
                                <div
                                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-prism-from/30 transition-colors cursor-pointer"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  {imagePreview ? (
                                    <div className="flex flex-col items-center">
                                      <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-md mb-3" />
                                      <p className="text-sm text-muted-foreground">Click to change image</p>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                      <p className="text-sm text-muted-foreground">Click to browse or drag and drop</p>
                                      <p className="text-xs text-muted-foreground/50 mt-1">PNG, JPG, WEBP up to 5MB</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="targetAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Amount (ETH)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" step="0.01" placeholder="50" {...field} className="bg-background border-border text-foreground pr-14 focus:border-prism-from/50" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ETH</span>
                              </div>
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="minContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Contribution</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type="number" step="0.001" placeholder="0.01" {...field} className="bg-background border-border text-foreground pr-14 focus:border-prism-from/50" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ETH</span>
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Contribution</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type="number" step="0.01" placeholder="5" {...field} className="bg-background border-border text-foreground pr-14 focus:border-prism-from/50" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ETH</span>
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-background border-border text-foreground focus:border-prism-from/50" min={new Date().toISOString().split("T")[0]} />
                            </FormControl>
                            {field.value && daysUntilEnd > 0 && (
                              <p className="text-sm text-prism-from mt-2">Campaign ends in {daysUntilEnd} days</p>
                            )}
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="tokenName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Project Token" {...field} className="bg-background border-border text-foreground focus:border-prism-from/50" />
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tokenSymbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Symbol</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="MPT" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 5))}
                                className="bg-background border-border text-foreground uppercase focus:border-prism-from/50" 
                                maxLength={5} 
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">Maximum 5 characters, uppercase</p>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />

                      {(watchTokenName || watchTokenSymbol) && (
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground mb-2">Token Preview</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-prism-from/10 flex items-center justify-center">
                              <span className="text-prism-from font-bold text-sm">{watchTokenSymbol?.slice(0, 2) || "??"}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{watchTokenName || "Token Name"}</p>
                              <Badge variant="outline" className="border-prism-from/30 text-prism-from text-xs">{watchTokenSymbol || "SYM"}</Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-prism-from/5 border border-prism-from/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-prism-from flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Token Distribution</p>
                            <p>100 tokens per ETH (120 tokens for first 50% of goal - early investor bonus!)</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0} className="border-border text-muted-foreground hover:bg-muted rounded-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />Back
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep} className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
                      Next<ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : isConnected ? (
                    <Button type="submit" className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground hover:opacity-90 border-0 rounded-full">
                      <Rocket className="w-4 h-4 mr-2" />Launch Campaign
                    </Button>
                  ) : (
                    <Button type="button" className="bg-muted hover:bg-muted/80 text-muted-foreground font-semibold rounded-full">
                      <Wallet className="w-4 h-4 mr-2" />Connect Wallet to Launch
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
