import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/components/auth/AdminAuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PartyLive Admin Panel",
  description: "Panel de administración de PartyLiveApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-gray-950 text-white">
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
