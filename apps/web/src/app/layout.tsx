import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceLens | Find the best price before you buy",
  description: "Identify products from a photo or search by name, then compare real offers with PriceLens.",
  metadataBase: new URL("https://web-iota-eight-65vpz9b67q.vercel.app"),
  openGraph: { title: "PriceLens | Shop with clarity", description: "Identify products and compare real offers before you buy.", images: ["/landing/brand.png"] }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
