import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "AppOrgania - Gestão Agrícola Inteligente",
  description:
    "Plataforma completa para gestão agrícola, monitoramento de propriedades e análise de dados em tempo real",
  keywords: ["agricultura", "gestão agrícola", "monitoramento", "análise de solo", "irrigação"],
  authors: [{ name: "AppOrgania Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
    shortcut: "/favicon.png",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#10b981",
  openGraph: {
    title: "AppOrgania - Gestão Agrícola",
    description: "Plataforma completa para gestão agrícola e monitoramento de propriedades",
    type: "website",
    locale: "pt_BR",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div id="root">{children}</div>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
