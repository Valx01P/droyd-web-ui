import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier 08 — Interactive Walk-in Wardrobe",
  description:
    "A hyper-detailed interactive walk-in wardrobe rendered in real time with Three.js.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
