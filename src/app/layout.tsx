import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TempoInit } from "./tempo-init";
import ClientAuthProvider from "./client-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "The Habit Hero - Gamified Habit Tracker",
  description: "Track your habits with a fun, gamified experience",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://habitheroes.app",
  ),
  openGraph: {
    title: "The Habit Hero - Gamified Habit Tracker",
    description: "Track your habits with a fun, gamified experience",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ClientAuthProvider>{children}</ClientAuthProvider>
        <TempoInit />
      </body>
    </html>
  );
}
