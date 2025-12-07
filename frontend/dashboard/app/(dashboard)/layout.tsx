import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"

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
  if (!pathname.startsWith("/onboarding")) {
    const { data: org } = await supabase
      .from("organizations")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()
    
    if (org && !org.onboarding_completed) {
      redirect("/onboarding/organization")
    }
  }

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
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

