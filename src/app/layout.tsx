import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
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
  title: "CRV4 Mayorista",
  description: "Catálogo y gestión de pedidos, ventas y stock",
  applicationName: "CRV4 Mayorista",
  appleWebApp: { capable: true, title: "CRV4", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  // Deja dibujar debajo de la barra del sistema: la barra inferior azul la cubre (ver navegacion.tsx).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
