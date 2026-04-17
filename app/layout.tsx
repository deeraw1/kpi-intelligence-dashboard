import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'KPI Intelligence Dashboard',
  description: 'Upload any business metrics CSV — get trends, forecasts, health scores and alerts instantly',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
