import type { Metadata } from 'next'
import { Eczar } from "next/font/google";
import './globals.css'

const globalFont = Eczar({subsets: ["latin"]})

export const metadata: Metadata = {
  title: 'Magic: The Griddening',
  description: 'Game in the style of the Immaculate Grid for Magic: The Gathering cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={globalFont.className}>{children}</body>
    </html>
  )
}
