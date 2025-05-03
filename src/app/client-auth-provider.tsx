"use client";

import { AuthSessionProvider } from "@/components/auth-session-provider";

export default function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
