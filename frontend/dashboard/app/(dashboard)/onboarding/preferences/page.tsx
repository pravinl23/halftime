"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TargetingForm } from "@/components/onboarding/targeting-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${apiUrl}/api/v1/onboarding/targeting-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
      toast.success("Preferences saved!")
      router.push("/onboarding/content")
        router.refresh()
      } else {
        toast.error("Failed to save preferences")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-8">
        <h2 className="text-white text-[28px] font-bold mb-2 text-center tracking-tight">Define Your Target Audience</h2>
        <p className="text-white/60 mb-6 text-center text-[15px]">
          Tell us about the customers you want to reach with your campaigns.
        </p>
        
        <TargetingForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}
