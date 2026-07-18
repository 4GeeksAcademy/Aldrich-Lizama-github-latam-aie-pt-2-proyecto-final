// ============================================================
// Nexova — Talent Pipeline Tracker · SSE hook
// ============================================================

"use client";

import { useEffect, useRef, useCallback } from "react";

type EventHandler = (data: any) => void;

interface UseEventSourceOptions {
  /** Parámetros de filtro para la URL del SSE */
  search?: string;
  status?: string;
  stage?: string;
  /** Handler cuando llegan nuevos registros */
  onRecords?: EventHandler;
  /** Handler cuando hay un error en el stream */
  onError?: EventHandler;
  /** Habilitar/deshabilitar la conexión */
  enabled?: boolean;
}

export function useEventSource({
  search,
  status,
  stage,
  onRecords,
  onError,
  enabled = true,
}: UseEventSourceOptions) {
  // Usamos refs para los callbacks para evitar reconexiones
  const onRecordsRef = useRef(onRecords);
  const onErrorRef = useRef(onError);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Mantener refs actualizados sin causar re-renders
  onRecordsRef.current = onRecords;
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Cerrar conexión anterior si existe
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Construir URL con filtros
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    if (stage) qs.set("stage", stage);
    const queryStr = qs.toString();
    const url = `/api/events${queryStr ? `?${queryStr}` : ""}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("records", (event) => {
      try {
        const data = JSON.parse(event.data);
        onRecordsRef.current?.(data);
        retryCountRef.current = 0;
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    });

    es.addEventListener("error", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onErrorRef.current?.(data);
      } catch {
        onErrorRef.current?.({ error: "Connection lost" });
      }

      retryCountRef.current += 1;
      if (retryCountRef.current >= maxRetries) {
        es.close();
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    });

    es.onopen = () => {
      retryCountRef.current = 0;
    };
  }, [search, status, stage, enabled]); // Solo filtros, no callbacks

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
}