"use client"

import { usePathname } from "next/navigation"
import { Stepper } from "@/components/onboarding/stepper"
import { Toaster } from "@/components/ui/sonner"

const steps = ["Organization", "Audience", "Content"]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Determine current step based on pathname
  const currentStep = pathname.includes("/content") 
    ? 2 
    : pathname.includes("/preferences") 
    ? 1 
    : 0

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Let's set up your account</p>
        </div>
        
        <Stepper currentStep={currentStep} steps={steps} />
        
        <div className="mt-8">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
