"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  title: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <motion.div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                index < currentStep
                  ? "bg-emerald-500 border-emerald-500"
                  : index === currentStep
                  ? "border-emerald-500 text-emerald-500"
                  : "border-border text-muted-foreground"
              )}
              initial={{ scale: 0.8 }}
              animate={{ scale: index === currentStep ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5 text-black" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </motion.div>
            <span
              className={cn(
                "text-sm mt-2 hidden sm:block",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-16 md:w-24 h-0.5 mx-2",
                index < currentStep ? "bg-emerald-500" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
