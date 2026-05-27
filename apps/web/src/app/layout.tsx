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
  metadataBase: new URL("https://cadencerun.fr"),
  alternates: { canonical: "/" },
  title: "Cadence — AI Running Coach that Anticipates",
  description:
    "Cadence reads your sleep, recovery, heart rate, and load — then adjusts your plan before you even open the app. Not a tool that responds. A coach that observes, anticipates, and prevents.",
  keywords: [
    "running",
    "AI coach",
    "training plan",
    "marathon",
    "running app",
    "Garmin",
    "Apple Watch",
    "HRV",
    "recovery",
    "proactive coaching",
  ],
  openGraph: {
    title: "Cadence — AI Running Coach that Anticipates",
    description:
      "Not reactive. Cadence reads your sleep, recovery, and load continuously — and adjusts tomorrow's session before you open the app.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence — AI Running Coach that Anticipates",
    description:
      "Not reactive. Cadence reads your sleep, recovery, and load continuously — and adjusts tomorrow's session before you open the app.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
