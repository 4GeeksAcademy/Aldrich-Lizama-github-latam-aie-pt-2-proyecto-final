"use client";

import { useMemo } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  // Generar array de páginas visibles (ej: [1, '...', 4, 5, 6, '...', 20])
  const pages = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (page > 3) items.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        items.push(i);
      }
      if (page < totalPages - 2) items.push("ellipsis");
      items.push(totalPages);
    }
    return items;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-nexova-border/50 pt-4 mt-4" aria-label="Paginación">
      <p className="text-sm text-nexova-muted">
        {total} candidato{total !== 1 ? "s" : ""} · Página {page} de {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        {/* Anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center rounded-md border border-nexova-border px-3 py-1.5 text-sm font-medium text-nexova-text hover:bg-nexova-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          ◀ Anterior
        </button>

        {/* Números de página */}
        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-nexova-muted select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                p === page
                  ? "border-nexova-hover bg-nexova-text text-nexova-bg"
                  : "border-nexova-border text-nexova-text hover:bg-nexova-accent/50"
              }`}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Página ${p}`}
            >
              {p}
            </button>
          )
        )}

        {/* Siguiente */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center rounded-md border border-nexova-border px-3 py-1.5 text-sm font-medium text-nexova-text hover:bg-nexova-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          Siguiente ▶
        </button>
      </div>
    </nav>
  );
}