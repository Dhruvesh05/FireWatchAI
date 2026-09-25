import type { Metadata } from "next";
import { Inter, DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FireWatch AI — AI-Powered Forest Fire & Smoke Detection",
  description:
    "FireWatch AI uses YOLOv8 computer vision to detect potential fire and smoke events from images, videos, and live camera feeds, helping users monitor incidents and respond faster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${outfit.variable} dark`}
      style={{ scrollBehavior: "smooth" }}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}
