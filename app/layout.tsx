import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { FloatingHeartsBackground } from "@/components/ui/FloatingHeartsBackground";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Preference Plus — intentional dating",
  description:
    "Mutual compatibility, transparent fit signals, and private preferences. Prototype built for demos and investor conversations.",
  applicationName: "Preference Plus"
};

export const viewport: Viewport = {
  themeColor: "#fff8f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className={`${dmSans.className} min-h-screen bg-bg font-sans antialiased text-ink`}>
        <FloatingHeartsBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
