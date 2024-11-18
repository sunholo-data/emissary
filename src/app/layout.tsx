// src/app/layout.tsx
import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { AlertDialogProvider } from "@/components/hooks/use-alert-dialog"
import { FirebaseInit } from '@/components/FirebaseInit'
import SessionTimeout from '@/components/SessionTimeout';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        inter.className,
        // Add base background color to prevent black background
        'bg-background min-h-screen'
      )}>

      <AlertDialogProvider>
        <SessionTimeout timeoutMinutes={15} warningMinutes={1} />
        <FirebaseInit />
        {children}
        <Toaster />
      </ AlertDialogProvider>
      </body>
    </html>
  )
}