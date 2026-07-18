// ============================================================
// Nexova — Talent Pipeline Tracker · SSE endpoint
// ============================================================
// Esta ruta actúa como proxy SSE: cada 10 segundos consulta
// la API externa y empuja los cambios al frontend en tiempo real.

import { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://playground.4geeks.com/tracker/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const stage = searchParams.get("stage") || "";
  const search = searchParams.get("search") || "";

  // Construir query string para la API externa
  const qs = new URLSearchParams();
  qs.set("limit", "200");
  if (status) qs.set("status", status);
  if (stage) qs.set("stage", stage);
  if (search) qs.set("search", search);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastData = "";

      const poll = async () => {
        try {
          const res = await fetch(`${API_URL}/records?${qs.toString()}`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          });

          if (!res.ok) {
            // Enviar evento de error, pero mantener el stream vivo
            const errorMsg = JSON.stringify({ error: `API error ${res.status}` });
            controller.enqueue(encoder.encode(`event: error\ndata: ${errorMsg}\n\n`));
            return;
          }

          const json = await res.json();
          const raw = JSON.stringify(json);

          // Solo enviar si los datos cambiaron
          if (raw !== lastData) {
            lastData = raw;
            controller.enqueue(encoder.encode(`event: records\ndata: ${raw}\n\n`));
          }
        } catch (err) {
          const errorMsg = JSON.stringify({ error: "Connection error" });
          controller.enqueue(encoder.encode(`event: error\ndata: ${errorMsg}\n\n`));
        }
      };

      // Hacer polling cada 10 segundos
      const intervalId = setInterval(poll, 10_000);

      // Primer polling inmediato
      await poll();

      // Cleanup al cerrar la conexión
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}