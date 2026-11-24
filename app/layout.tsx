import type { Metadata } from "next";
import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { VAULT } from "@/lib/vault";
import LiveRefresh from "@/components/LiveRefresh";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Homebase", description: "Your Obsidian vault, as a living dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-private="1" suppressHydrationWarning className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased`}>
      <body className="bg-grid min-h-screen">
        <LiveRefresh />
        <div className="flex min-h-screen">
          <Sidebar vault={VAULT} />
          <main className="flex-1 min-w-0 px-5 md:px-10 py-8 max-w-[1500px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
