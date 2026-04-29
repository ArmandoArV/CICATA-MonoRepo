import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/frontend/contexts";
import { FluentWrapper } from "@/frontend/components/layouts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiCicata — Gestión Académica",
  description:
    "Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50">
        <FluentWrapper>
          <AuthProvider>{children}</AuthProvider>
        </FluentWrapper>
      </body>
    </html>
  );
}
