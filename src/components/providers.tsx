"use client";

import { SessionProvider } from "next-auth/react";
import { CompareProvider } from "@/lib/stores/compare-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CompareProvider>{children}</CompareProvider>
    </SessionProvider>
  );
}
