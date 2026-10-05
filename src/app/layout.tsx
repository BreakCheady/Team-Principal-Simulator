import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Principal Simulator",
  description: "Ein Motorsport-Managementspiel über Menschen, Macht, Strategie und Fahrerlagerpolitik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
