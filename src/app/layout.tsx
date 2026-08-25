import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Grupo Las Flores",
  description: "Prototipo de CRM para Restaurante Las Flores, Hotel Umaru y Mamina Restobar",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
