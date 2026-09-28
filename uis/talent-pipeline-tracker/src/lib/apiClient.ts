"use client";

import { getAuthApiBaseUrl } from "@/context/AuthContext";

const AUTH_TOKEN_KEY = "nexova_access_token";

export async function apiClient(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = getAuthApiBaseUrl().replace(/\/$/, "");
  const url = new URL(path, `${baseUrl}/`);
  if (url.origin !== new URL(baseUrl).origin) {
    throw new Error("La petición autenticada debe usar la API de Nexova.");
  }

  const headers = new Headers(init.headers);
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(new Event("nexova:auth-changed"));
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  return response;
}
