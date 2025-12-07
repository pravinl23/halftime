"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Backend API URL - adjust if your backend runs on a different port
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

// Helper function to get watched shows from localStorage
function getWatchedShows(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("watchedShows")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper function to analyze user profile after login
async function analyzeUserProfile(accessToken: string) {
  try {
    const watchedShows = getWatchedShows()
    
    const response = await fetch(`${BACKEND_API_URL}/api/v1/profile/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        platform_data: {
          shows_watched: watchedShows,
          cookies: {
            // Add any relevant cookie data here
            visited_pages: typeof document !== "undefined" ? [document.referrer].filter(Boolean) : []
          },
          browsing_history: []
        }
      })
    })
    
    if (!response.ok) {
      console.error("Profile analysis failed:", response.status, response.statusText)
      return null
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error analyzing profile:", error)
    return null
  }
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Get the access token for API calls
      const accessToken = data.session?.access_token

      // Redirect immediately - don't wait for analysis
      toast.success("Logged in successfully!")
      router.push("/")
      router.refresh()

      // Analyze user profile in the background (fire and forget)
      if (accessToken) {
        console.log("🔍 Starting background profile analysis...")
        // Run in background without blocking
        analyzeUserProfile(accessToken)
          .then((profileAnalysis) => {
            if (profileAnalysis) {
              console.log("\n" + "=".repeat(60))
              console.log("📊 USER PROFILE ANALYSIS RESULT")
              console.log("=".repeat(60))
              console.log(JSON.stringify(profileAnalysis, null, 2))
              console.log("=".repeat(60) + "\n")
              
              // Show the recommended product in a toast (non-blocking)
              if (profileAnalysis.final_decision) {
                const decision = profileAnalysis.final_decision
                toast.success(
                  `Recommended for you: ${decision.product} by ${decision.company}`,
                  { duration: 5000 }
                )
              }
            }
          })
          .catch((error) => {
            // Silently handle errors - don't interrupt user experience
            console.error("Background profile analysis error:", error)
          })
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
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
        <h1 className="text-white text-[31px] font-bold mb-8 text-center">Sign in</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
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
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-full bg-white text-black font-bold text-[16px] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-white/60 text-[15px]">Don't have an account? </span>
          <Link href="/signup" className="text-[#1d9bf0] hover:text-[#1d9bf0]/80 hover:underline text-[15px] font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

