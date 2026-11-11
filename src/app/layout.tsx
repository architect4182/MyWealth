import type { Metadata } from "next";
import "./globals.css";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { PersistentHeader } from "@/components/PersistentHeader";

export const metadata: Metadata = {
  title: "MyWealth",
  description: "A clearer view of everything you're building.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
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
              {children}
            </PortfolioProvider>
          </body>
        </html>
        );
}
