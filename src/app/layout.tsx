import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Max Sun - Portfolio",
  description: "Computer Engineering student at University of Waterloo. Building games, web apps, and exploring new technologies.",
  keywords: ["Max Sun", "portfolio", "software engineer", "game developer", "UWaterloo", "computer engineering"],
  authors: [{ name: "Max Sun" }],
  openGraph: {
    title: "Max Sun - Portfolio",
    description: "Computer Engineering student at University of Waterloo. Building games, web apps, and exploring new technologies.",
    url: "https://maxsun.ca",
    siteName: "Max Sun",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Max Sun - Portfolio",
    description: "Computer Engineering student at University of Waterloo. Building games, web apps, and exploring new technologies.",
  },
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-mono antialiased bg-[#0F172A] text-[#FAFAFA]`}
      >
        {children}
      </body>
    </html>
  );
}
