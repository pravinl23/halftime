import { Toaster } from "@/components/ui/sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-2">Dashboard</h1>
          <p className="text-muted-foreground">AI-Generated Ads Platform</p>
        </div>
        {children}
      </div>
      <Toaster />
    </div>
  )
}
