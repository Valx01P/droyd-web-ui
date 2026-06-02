import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-tech",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Droyd | He's Back",
  description:
    "A cinematic noir origin story for Droyd, the robot who returned from the mad scientist's forbidden lab.",
  openGraph: {
    title: "Droyd | He's Back",
    description:
      "A movie-themed interactive origin story built around Droyd, a robot, a mad scientist, and the case file that should have stayed buried.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
