import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zinab — Know your land. Grow with confidence.",
  description:
    "Voice AI assistant that explains real satellite, weather, and soil data for any location in Ethiopia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
