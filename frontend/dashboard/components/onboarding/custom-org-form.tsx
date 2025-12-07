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
    <div className="glass-card p-8">
      <h3 className="text-white text-[24px] font-bold mb-6 text-center tracking-tight">Create Custom Organization</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName" className="text-white text-[14px] font-medium">Company Name *</Label>
          <Input
            id="orgName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Company Inc."
            required
            disabled={isLoading}
            className="glass-card h-12 text-white placeholder:text-white/40 text-base px-4 hover:brightness-110 focus:opacity-90 transition-all border-0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vertical" className="text-white text-[14px] font-medium">Industry (Optional)</Label>
          <Input
            id="vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            placeholder="E-commerce, SaaS, Fashion, etc."
            disabled={isLoading}
            className="glass-card h-12 text-white placeholder:text-white/40 text-base px-4 hover:brightness-110 focus:opacity-90 transition-all border-0"
          />
        </div>
        
        <Button
          type="submit"
          className="glass-card w-full h-11  text-white font-medium text-[16px] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-2 border-0"
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? "Creating..." : "Continue"}
        </Button>
      </form>
    </div>
  )
}
