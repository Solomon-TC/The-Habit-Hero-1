import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TempoInit } from "./tempo-init";
import ClientAuthProvider from "./client-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HabitQuest - Gamified Habit Tracker",
  description: "Track your habits with a fun, gamified experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempo.new/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={`${inter.className} min-h-screen bg-white`}>
        <ClientAuthProvider>{children}</ClientAuthProvider>
        <TempoInit />
      </body>
    </html>
  );
}
