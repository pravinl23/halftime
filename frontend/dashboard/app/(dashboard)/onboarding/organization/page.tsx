"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CompanySearch } from "@/components/onboarding/company-search"
import { CustomOrgForm } from "@/components/onboarding/custom-org-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function OrganizationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const handleCompanySelect = async (company: any) => {
    setIsLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${apiUrl}/api/v1/onboarding/organizations/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name: company.name,
          logo_url: company.logo_url,
          brand_colors: company.brand_colors,
        })
      })
      
      if (response.ok) {
        toast.success("Organization saved!")
        router.push("/onboarding/preferences")
      } else {
        toast.error("Failed to save organization")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomOrg = async (data: { name: string; vertical?: string }) => {
    setIsLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${apiUrl}/api/v1/onboarding/organizations/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          name: data.name,
          vertical: data.vertical,
        })
      })
      
      if (response.ok) {
        toast.success("Organization created!")
        router.push("/onboarding/preferences")
      } else {
        toast.error("Failed to create organization")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-8 min-h-[450px]">
        <h2 className="text-white text-[28px] font-bold mb-2 text-center tracking-tight">Select Your Organization</h2>
        <p className="text-white/60 mb-6 text-center text-[15px]">
          Search for your company to automatically load brand assets, or create a custom organization.
        </p>
        
        <CompanySearch onSelect={handleCompanySelect} />
        
        <div className="text-center mt-6 pt-6 border-t border-white/20">
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-sm text-white hover:text-white/80 hover:underline font-medium transition-colors"
          >
            {showCustomForm ? "Hide custom form" : "Can't find your company? Create custom organization"}
          </button>
        </div>
      </div>
      
      {showCustomForm && (
        <CustomOrgForm onSubmit={handleCustomOrg} isLoading={isLoading} />
      )}
    </div>
  )
}
