import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import React from "react"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LLMSwitch - AI Chat Interface",
  description: "Chat interface for Deepseek and Claude LLMs",
  authors: [{ name: "LLMSwitch" }],
  keywords: ["AI", "Chat", "LLM", "Deepseek", "Claude"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head />
      <body
        suppressHydrationWarning
        className={cn(
          "h-full bg-background font-sans antialiased",
          inter.className
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
