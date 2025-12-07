"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  BarChart3,
  Users,
  MapPin,
  Settings,
  LogOut,
} from "lucide-react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Analytics", href: "/?view=analytics", icon: BarChart3 },
  { name: "Viewers", href: "/?view=viewers", icon: Users },
  { name: "Placements", href: "/?view=placements", icon: MapPin },
  { name: "Preferences", href: "/?view=preferences", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const currentView = searchParams.get('view') || 'analytics'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
    router.refresh()
  }

  return (
    <ShadcnSidebar className="bg-black relative z-10 border-r border-white/10" style={{ borderRadius: 0 }}>
      <SidebarHeader className="border-b border-white/10 p-6 bg-black">
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="HalfTime Logo" className="h-[20px] w-auto" />
          HalfTime
        </h1>
        <p className="text-xs text-white/60 tracking-wider">AI Ads Platform</p>
      </SidebarHeader>

      <SidebarContent className="bg-black">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 text-[10px] tracking-widest px-4 py-3 font-medium">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const viewName = item.href.split('view=')[1]
                const isActive = currentView === viewName
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        w-full px-4 py-2.5 transition-all border-l-2
                        ${isActive 
                          ? 'bg-white/10 text-white border-l-white' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white border-l-transparent'
                        }
                      `}
                    >
                      <Link href={item.href} className="flex w-full items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-6 pb-8 bg-black">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="glass-card w-full font-medium text-white hover:opacity-90 text-sm transition-all hover:scale-[1.02] active:scale-[0.98] py-3 border-0"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}

