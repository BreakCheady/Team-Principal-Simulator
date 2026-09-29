import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Principal Simulator",
  description: "A motorsport management game about people, power and paddock politics.",
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
