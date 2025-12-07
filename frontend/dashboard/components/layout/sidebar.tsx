"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const navigation = [
  { name: "Home", href: "/dashboard", icon: "🏠" },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: "📊" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full w-64 border-r border-border bg-background">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-black">Dashboard</h1>
        <p className="text-xs text-muted-foreground">AI Ads Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-full transition-colors
                ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-muted"
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-base">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full rounded-full font-bold"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
