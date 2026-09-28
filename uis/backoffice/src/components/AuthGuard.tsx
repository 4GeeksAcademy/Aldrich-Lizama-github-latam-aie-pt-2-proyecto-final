"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!isAuthRoute && !isLoading && !isAuthenticated)
      router.replace("/login");
  }, [isAuthRoute, isAuthenticated, isLoading, router]);

  if (isAuthRoute) return children;

  if (isLoading) {
    return (
      <main
        role="status"
        aria-live="polite"
        aria-busy="true"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <p>Verificando sesión…</p>
      </main>
    );
  }

  if (!isAuthenticated) return null;
  return children;
}
