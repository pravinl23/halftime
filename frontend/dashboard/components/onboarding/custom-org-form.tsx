"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface CustomOrgFormProps {
  onSubmit: (data: { name: string; vertical?: string }) => void
  isLoading: boolean
}

export function CustomOrgForm({ onSubmit, isLoading }: CustomOrgFormProps) {
  const [name, setName] = useState("")
  const [vertical, setVertical] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({ name, vertical: vertical || undefined })
    }
  }

  return (
    <div className="backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl p-10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
      <h3 className="text-white text-[24px] font-bold mb-6 text-center">Create Custom Organization</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName" className="text-white text-[15px] font-medium">Company Name *</Label>
          <Input
            id="orgName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Company Inc."
            required
            disabled={isLoading}
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vertical" className="text-white text-[15px] font-medium">Industry (Optional)</Label>
          <Input
            id="vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            placeholder="E-commerce, SaaS, Fashion, etc."
            disabled={isLoading}
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full h-12 rounded-full bg-[#1d9bf0] text-white font-bold text-[16px] hover:bg-[#1a8cd8] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg mt-2"
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? "Creating..." : "Continue"}
        </Button>
      </form>
    </div>
  )
}
