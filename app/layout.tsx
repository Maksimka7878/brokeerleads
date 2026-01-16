import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B2B Sales Tracker",
  description: "CRM for B2B Sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
