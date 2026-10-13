import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas",
  description: "Ordena tus ingresos y gastos y cuida tus hábitos de crédito.",
};

export const viewport: Viewport = { themeColor: "#0f0b1a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
