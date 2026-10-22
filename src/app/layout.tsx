import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canchero",
  description: "Reservá canchas deportivas cerca tuyo",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
