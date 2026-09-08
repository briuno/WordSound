import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ServiceWorkerManager } from "@/components/service-worker";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WordSound",
    template: "%s · WordSound",
  },
  description: "Learn. Listen. Go further. Estude ingles com leitura, audio e pratica guiada.",
  applicationName: "WordSound",
  manifest: "/manifest.webmanifest",
  // instalado no iPhone: abre em tela cheia, sem a barra do Safari
  appleWebApp: {
    capable: true,
    title: "WordSound",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  // deixa o app desenhar sob o notch e a barra de gestos; o padding vem das
  // safe areas em globals.css
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <ServiceWorkerManager />
      </body>
    </html>
  );
}
