import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

import { RouteGuard } from "@/components/RouteGuard";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";

const inter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Lapak Kos - Marketplace Barang Bekas Mahasiswa",
  description: "Platform jual beli barang bekas kos terdekat untuk mahasiswa dengan fitur geolocation.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} ${inter.variable}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <AuthProvider>
          <RouteGuard>
            <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
              {children}
            </main>
            <Footer />
            <AIChatbot />
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
