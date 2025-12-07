import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check onboarding status (skip check if already on onboarding pages)
  // TODO: Re-enable once Supabase backend is stable
  // if (!pathname.startsWith("/onboarding")) {
  //   const { data: org } = await supabase
  //     .from("organizations")
  //     .select("onboarding_completed")
  //     .eq("user_id", user.id)
  //     .single()
  //   
  //   if (org && !org.onboarding_completed) {
  //     redirect("/onboarding/organization")
  //   }
  // }

  // Don't show sidebar on onboarding pages
  if (pathname.startsWith("/onboarding")) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-black relative overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          <main className="flex-1 overflow-y-auto">
            <div className="h-full w-full px-4 py-4 lg:px-6 lg:py-6">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  )
}

