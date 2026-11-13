import type { Metadata } from "next";
import "./globals.css";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { PersistentHeader } from "@/components/PersistentHeader";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "MyWealth",
  description: "A clearer view of everything you're building.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <html lang="en" className="antialiased">
          <body className="min-h-screen flex flex-col">
            <PortfolioProvider>
              <PersistentHeader />
              <PageTransition>{children}</PageTransition>
            </PortfolioProvider>
          </body>
        </html>
        );
}
