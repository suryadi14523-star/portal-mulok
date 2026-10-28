import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal Mulok Keminangkabauan',
  description: 'SMAN 1 Payung Sekaki',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}