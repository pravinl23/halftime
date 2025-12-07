import type { Metadata } from "next";
import localFont from "next/font/local";
import { Forum } from "next/font/google";
import "./globals.css";

const chirp = localFont({
  src: [
    {
      path: "../fonts/Chirp-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Chirp-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Chirp-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/Chirp-Heavy.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-chirp",
});

const seasonSerif = localFont({
  src: "../fonts/SeasonSerif-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-season-serif",
});

const urbanist = localFont({
  src: "../fonts/Urbanist/Urbanist-VariableFont_wght.ttf",
  weight: "100 900",
  style: "normal",
  variable: "--font-urbanist",
});

const forum = Forum({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-forum",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Business owner dashboard for AI-generated ads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${urbanist.variable} ${chirp.variable} ${seasonSerif.variable} ${forum.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
