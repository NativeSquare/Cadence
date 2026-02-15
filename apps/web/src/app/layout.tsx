import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
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
          className={`${outfit.variable} ${jetbrainsMono.variable} antialiased font-sans`}
        >
          <ConvexClientProvider>
            <div className="min-h-screen bg-black text-white/[0.92] antialiased">
              <Nav />
              <main>{children}</main>
              <Footer />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
