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
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto relative z-10">
        <div className="mb-6">
          <h1 className="text-white text-[48px] font-bold tracking-tight flex items-center gap-3">
            <img src="/logo.png" alt="HalfTime Logo" className="h-[40px] w-auto" />
            HalfTime
          </h1>
        </div>
        
        <Stepper currentStep={currentStep} steps={steps} />
        
        <div className="mt-6">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
