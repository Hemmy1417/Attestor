import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { Backdrop } from "@/components/Backdrop";
import { NetworkBanner } from "@/components/NetworkBanner";
import { CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Attestor — visual proof-of-completion notary",
  description:
    "Lock GEN against acceptance criteria; a worker submits a photo as proof; a GenLayer vision panel confirms the image meets the criteria and releases payment. Proof you can see.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <Providers>
          <Backdrop />
          <Sidebar />
          <div className="md:ml-64 min-h-screen flex flex-col">
            <NetworkBanner />
            <main className="flex-1">{children}</main>
            <footer style={{ borderTop: "1px solid var(--line)" }}>
              <div className="px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
                <span className="mono">
                  Every ruling is a public, verifiable GenLayer transaction.
                </span>
                <Link
                  href={explorerAddressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  className="font-semibold hover:underline mono"
                  style={{ color: "var(--lime)" }}
                >
                  Contract on explorer ↗
                </Link>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
