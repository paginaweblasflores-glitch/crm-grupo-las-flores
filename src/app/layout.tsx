import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import { DataProvider } from "@/lib/data-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const TITULO = "CRM Consorcio Las Flores";
const DESCRIPCION =
  "Clientes y fidelización de Restaurante Las Flores, Hotel Umaru y Mamina Restobar.";

export const metadata: Metadata = {
  metadataBase: new URL("https://crm-grupo-las-flores.vercel.app"),
  title: TITULO,
  description: DESCRIPCION,
  // Vista previa al compartir el enlace (WhatsApp, Facebook, etc.): imagen 1200x630.
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: "/",
    siteName: TITULO,
    locale: "es_PE",
    type: "website",
    images: [{ url: "/og-crm.jpg", width: 1200, height: 630, alt: TITULO }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/og-crm.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DataProvider>
          <AppProvider>{children}</AppProvider>
        </DataProvider>
      </body>
    </html>
  );
}
