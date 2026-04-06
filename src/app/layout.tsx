import type { Metadata } from "next";
import { Eczar, Crimson_Text } from "next/font/google";
import "./globals.css";
import React from "react";

const displayFont = Eczar({ subsets: ["latin"], variable: "--font-display" });
const bodyFont = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Magic: The Griddening",
  description: "Game in the style of the Immaculate Grid for Magic: The Gathering cards",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <body className={`${displayFont.variable} ${bodyFont.variable} ${displayFont.className}`}>
        {children}
      </body>
    </html>
  );
}
