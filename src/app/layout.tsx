import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OracleTracker } from "@/lib/oracle/universal-tracker";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Oraculo",
  description: "Seu oraculo pessoal — pergunte qualquer coisa sobre seus padroes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oraculo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <OracleTracker appName="dashoraculo" />
        {children}
      </body>
    </html>
  );
}
