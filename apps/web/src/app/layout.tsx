import type { Metadata } from "next";
import { Geist, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { LocaleProvider } from "@/lib/i18n";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cadence.run"),
  alternates: { canonical: "/" },
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
    icon: "/favicon.svg",
    apple: "/logo-cadence.svg",
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
          className={`${geist.variable} ${robotoMono.variable} antialiased font-sans`}
        >
          <ConvexClientProvider>
            <LocaleProvider>
              <div className="min-h-screen bg-[#f3f3f3] text-[#131313] antialiased font-[family-name:var(--font-geist)]">
                <main>{children}</main>
              </div>
            </LocaleProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
