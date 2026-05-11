import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TheKid - Gestión de Flota',
  description: 'Sistema de gestión operativa de flota y combustible',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
