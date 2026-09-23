import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={`${inter.variable} dark`}
      style={{ scrollBehavior: "smooth" }}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}
