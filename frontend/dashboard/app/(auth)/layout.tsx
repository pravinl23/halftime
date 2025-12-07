import { Toaster } from "@/components/ui/sonner"
import { AnimatedBackground } from "@/components/layout/animated-background"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-[600px] relative z-10">
        {children}
      </div>
      <Toaster />
    </div>
  )
}

