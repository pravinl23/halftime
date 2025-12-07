import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const chirp = localFont({
  src: [
    {
      path: "../public/fonts/Chirp-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Chirp-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Chirp-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Chirp-Heavy.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-chirp",
});

export const metadata: Metadata = {
  title: "XVideos - Your Content",
  description: "A Netflix-style content dashboard for xAI Hackathon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${chirp.variable} antialiased bg-black text-white font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
