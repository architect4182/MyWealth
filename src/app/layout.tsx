import type { Metadata } from "next";
import "./globals.css";
import { PortfolioProvider } from "@/context/PortfolioContext";

export const metadata: Metadata = {
  title: "MyWealth — Wealth & Investment Tracker",
  description: "A clearer view of everything you're building.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PortfolioProvider>{children}</PortfolioProvider>
      </body>
    </html>
  );
}
