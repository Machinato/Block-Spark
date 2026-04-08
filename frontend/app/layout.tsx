import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/lib/language-context'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space-grotesk",
  display: "swap",
})

const inter = Inter({ 
  subsets: ["latin", "cyrillic"], 
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'BlockSpark - Decentralized Crowdfunding on Base',
  description: 'Fund the future and own the vision. Back innovative projects on Base Sepolia and earn token rewards as they succeed.',
  keywords: ['crowdfunding', 'blockchain', 'Base', 'crypto', 'DeFi', 'tokens', 'Web3'],
}

export const viewport: Viewport = {
  themeColor: '#0d0a14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans antialiased bg-[#0d0a14] text-foreground min-h-screen`}>
        <LanguageProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
