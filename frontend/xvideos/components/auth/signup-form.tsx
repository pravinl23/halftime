"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        toast.success("Account created successfully!")
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push("/")
        router.refresh()
      } else {
        toast.success("Please check your email to confirm your account!")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error?.message || "An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-12 flex items-center gap-1">
        {/* X Logo */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-white r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-18jsvk2 r-16y2uox r-8kz0gk">
          <g>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </g>
        </svg>
        <span className="text-2xl font-bold text-white">Videos</span>
      </div>

      <div className="w-full max-w-[480px] backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl p-10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
        <h1 className="text-white text-[31px] font-bold mb-8 text-center">Create your account</h1>
        
        <form onSubmit={handleSignup} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
          
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-full bg-white text-black font-bold text-[16px] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-white/60 text-[15px]">Already have an account? </span>
          <Link href="/login" className="text-[#1d9bf0] hover:text-[#1d9bf0]/80 hover:underline text-[15px] font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

