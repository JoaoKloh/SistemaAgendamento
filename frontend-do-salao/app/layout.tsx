import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter, Instrument_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Sem `weight` fixo: como fonte variável o Google serve arquivos /s/*.woff2.
// Pesos estáticos (500/600) vêm como /l/font?kit=...&skey=..., URL com query
// que o carregador de fontes do Turbopack não resolve ("queries have exactly
// one entry"). A fonte variável cobre os mesmos pesos.
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
})

const SITE_URL = 'https://davidrabello.com.br'
const SITE_NAME = 'David Rabello · Salão Ideal'
const SITE_DESCRIPTION =
  'Barbearia e estética masculina em Petrópolis, Rio de Janeiro. Cortes, barboterapia e vibroterapia no tradicional Salão Ideal.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s · Salão Ideal',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'barbearia Petrópolis',
    'corte masculino Petrópolis',
    'barbeiro',
    'barbeiro perto de mim',
    'corte tesoura masculino',
    'corte de cabelo e barba em Petropólis',
    'corte na régua Petrópolis',
    'corte disfarçado Petrópolis',
    'barboterapia',
    'vibroterapia',
    'Salão Ideal',
  ],
  generator: 'v0.app',
  icons: {
    icon: '/apple-icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`light bg-background ${playfair.variable} ${inter.variable} ${instrumentSans.variable}`}
    >
      <body className="antialiased font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}