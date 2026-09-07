import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://myvaultexchange.com"),
  title: "MyVaultExchange — scan, price, collect coins & paper money",
  description:
    "Identify coins and banknotes, then price them from eBay last sold and Heritage Auctions.",
  applicationName: "MyVaultExchange",
  appleWebApp: {
    capable: true,
    title: "MyVaultExchange",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a7a46",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-queen font-sans text-cream">{children}</body>
    </html>
  );
}
