import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'OpenManifest - Gestão de NF-e Open Source',
    template: '%s | OpenManifest',
  },
  description: 'Plataforma gratuita e open source para empresas visualizarem, baixarem e manifestarem notas fiscais emitidas contra seu CNPJ.',
  keywords: ['NF-e', 'nota fiscal eletrônica', 'manifestação', 'SEFAZ', 'open source', 'gestão fiscal'],
  authors: [{ name: 'OpenManifest' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'OpenManifest - Gestão de NF-e Open Source',
    description: 'Plataforma gratuita e open source para empresas visualizarem, baixarem e manifestarem notas fiscais emitidas contra seu CNPJ.',
    siteName: 'OpenManifest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenManifest - Gestão de NF-e Open Source',
    description: 'Plataforma gratuita e open source para gestão de notas fiscais eletrônicas.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
