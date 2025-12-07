import type { Metadata } from "next";
import localFont from "next/font/local";
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
        className={`${chirp.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
