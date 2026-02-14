import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadence — Your AI Running Coach",
  description:
    "Train smarter with an AI coach that explains every decision. Personalized plans, wearable integration, and real-time coaching for runners chasing their next PR.",
  keywords: [
    "running",
    "AI coach",
    "training plan",
    "marathon",
    "running app",
    "Garmin",
    "COROS",
    "Apple Watch",
    "periodization",
  ],
  openGraph: {
    title: "Cadence — Your AI Running Coach",
    description:
      "Personalized AI coaching that explains every decision. Train smarter, race faster, stay healthy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence — Your AI Running Coach",
    description:
      "Personalized AI coaching that explains every decision. Train smarter, race faster, stay healthy.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <div className="min-h-screen bg-[#000000] text-white">
              <Nav />
              <main className="pt-16">{children}</main>
              <Footer />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
