import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'rank',
  description: 'Create and rank your lists',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
