"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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

      // On success, always send them to the main dashboard root
      toast.success("Logged in successfully!")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8">
        <h1 className="text-white text-[48px] font-bold tracking-tight text-center flex items-center justify-center gap-3">
          <img src="/logo.png" alt="HalfTime Logo" className="h-[40px] w-auto" />
          HalfTime
        </h1>
      </div>

      <div className="w-full max-w-[480px] glass-card p-8">
        <h1 className="text-white text-[28px] font-bold mb-6 text-center tracking-tight">Sign in to Dashboard</h1>
        
        <div className="space-y-3 mb-5">
          <Button
            type="button"
            className="glass-card w-full h-11  text-white font-medium text-[15px] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-0"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
            </svg>
            Sign in with Google
          </Button>
          
          <Button
            type="button"
            className="glass-card w-full h-11  text-white font-medium text-[15px] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-0"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
              <path fill="currentColor" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.966 4.62z"></path>
            </svg>
            Sign in with Apple
          </Button>
        </div>

        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-white/60 text-[14px]">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="glass-card h-12 text-white placeholder:text-white/50 text-base px-4 hover:opacity-90 focus:opacity-90 transition-all border-0"
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="glass-card h-12 text-white placeholder:text-white/50 text-base px-4 hover:opacity-90 focus:opacity-90 transition-all border-0"
          />
          
          <Button
            type="submit"
            disabled={isLoading}
            className="glass-card w-full h-11  text-white font-medium text-[16px] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-0"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-white/80 text-[14px]">Don't have an account? </span>
          <Link href="/signup" className="text-white hover:text-white/80 hover:underline text-[14px] font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
