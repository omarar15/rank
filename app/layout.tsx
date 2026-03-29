import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'rank',
  description: 'Create and rank your lists',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-stone-50">
      <body className="bg-transparent">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
