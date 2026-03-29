import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'rank',
  description: 'Create and rank your lists',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-stone-50 ${nunito.className}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var m=document.querySelector('meta[name=viewport]');if(m){if(m.content.indexOf('viewport-fit')===-1)m.content+=',viewport-fit=cover';}else{var n=document.createElement('meta');n.name='viewport';n.content='width=device-width,initial-scale=1,viewport-fit=cover';document.head.insertBefore(n,document.head.firstChild);}})();` }} />
      </head>
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  )
}
