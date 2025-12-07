import { Toaster } from "@/components/ui/sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <div className="w-full max-w-[600px] relative z-10">
        {children}
      </div>
      <Toaster />
    </div>
  )
}
