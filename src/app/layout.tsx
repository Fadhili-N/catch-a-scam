import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "Catch a Scam";
const description = "Check a TikTok or Instagram seller before you pay.";

export const metadata: Metadata = {
  // Lets every other page's relative openGraph/alternates URLs resolve
  // correctly without each one having to repeat the full domain.
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    // Account pages override this with their own @handle — see
    // generateMetadata in accounts/[platform]/[handle]/page.tsx — but
    // every other page keeps the site name as a suffix via this template.
    template: `%s — ${title}`,
  },
  description,
  openGraph: { title, description, url: siteUrl, siteName: title, locale: "en_KE" },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
