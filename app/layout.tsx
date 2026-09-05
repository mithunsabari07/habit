import type { Metadata } from 'next';
import { Epilogue, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { HabitProvider } from '@/lib/habitStore';
import { AppShell } from '@/components/AppShell';

const epilogue = Epilogue({
  subsets: ['latin'],
  variable: '--font-epilogue',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HabitPulse — Executive Habit Architecture & Analytics Platform',
  description:
    'Calibrated habit intelligence and behavioral cadence platform designed for high-performing executives.',
  icons: {
    icon: '/brand-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${epilogue.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased bg-surface text-on-surface">
        <HabitProvider>
          <AppShell>{children}</AppShell>
        </HabitProvider>
      </body>
    </html>
  );
}
