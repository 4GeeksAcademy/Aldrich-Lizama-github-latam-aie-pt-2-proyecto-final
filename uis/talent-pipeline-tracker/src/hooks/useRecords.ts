"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RecordOut, RecordCreate, StatusValue, StageValue } from "@/types";
import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  updateRecordData,
  deleteRecord,
  getNotes,
  addNote,
  deleteNote,
} from "@/lib/api";
import type { NoteOut } from "@/types";
import { useEventSource } from "./useEventSource";

// ─── Debounce hook ──────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}

// ─── Records hook ───────────────────────────────────────────

export function useRecords() {
  const [records, setRecords] = useState<RecordOut[]>([]);
  const [allRecords, setAllRecords] = useState<RecordOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  // Paginación
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("");

  // Versiones debounced de los filtros (500ms) para evitar reconexiones SSE
  const debouncedSearch = useDebounce(search, 500);
  const debouncedStatus = useDebounce(statusFilter, 500);
  const debouncedStage = useDebounce(stageFilter, 500);

  // Fetch inicial desde la API REST (usa los valores sin debounce para respuesta inmediata)
  const fetchRecords = useCallback(async () => {
    try {
      const data = await getRecords({
        search: search || undefined,
        status: statusFilter || undefined,
        stage: stageFilter || undefined,
      });
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar candidatos");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, stageFilter]);

  // Fetch de TODOS los registros (sin filtros) para las estadísticas reales
  const fetchAllRecords = useCallback(async () => {
    try {
      const data = await getRecords();
      setAllRecords(data);
    } catch {
      // Silencioso — no mostrar error por stats
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchRecords();
    fetchAllRecords();
  }, [fetchRecords, fetchAllRecords]);

  // SSE en tiempo real — usa valores debounced para evitar reconexiones en cada tecleo
  useEventSource({
    search: debouncedSearch,
    status: debouncedStatus,
    stage: debouncedStage,
    onRecords: (data) => {
      const incoming = data.data ?? [];
      setRecords(incoming);
      setPage(1);
      // Si no hay filtros activos, el SSE ya trae todos los registros → actualizamos allRecords
      // Si hay filtros, hacemos una llamada extra para obtener las stats reales
      if (!debouncedSearch && !debouncedStatus && !debouncedStage) {
        setAllRecords(incoming);
      } else {
        getRecords().then(setAllRecords).catch(() => {});
      }
      setError(null);
    },
    onError: (err) => {
      setError(err?.error ?? "Error de conexión en tiempo real");
    },
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const [filteredData, allData] = await Promise.all([
        getRecords({
          search: search || undefined,
          status: statusFilter || undefined,
          stage: stageFilter || undefined,
        }),
        getRecords(),
      ]);
      setRecords(filteredData);
      setAllRecords(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al refrescar");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, stageFilter]);

  // Calcular registros paginados
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = records.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, stageFilter]);

  return {
    records: paginatedRecords,
    allRecords,
    loading,
    error,
    page: safePage,
    totalPages,
    totalRecords: records.length,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    onPageChange: handlePageChange,
    refresh,
  };
}

// ─── Record detail hook ─────────────────────────────────────

export function useRecordDetail() {
  const [record, setRecord] = useState<RecordOut | null>(null);
  const [notes, setNotes] = useState<NoteOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordIdRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const [rec, notesData] = await Promise.all([
        getRecordById(id),
        getNotes(id),
      ]);
      setRecord(rec);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar detalle");
    }
  }, []);

  const open = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    recordIdRef.current = id;
    await fetchDetail(id);
    setLoading(false);
  }, [fetchDetail]);

  const close = useCallback(() => {
    setRecord(null);
    setNotes([]);
    setError(null);
    recordIdRef.current = null;
  }, []);

  // Polling del detalle mientras esté abierto
  useEffect(() => {
    if (!recordIdRef.current) return;
    const id = setInterval(() => {
      if (recordIdRef.current) fetchDetail(recordIdRef.current);
    }, 10_000);
    return () => clearInterval(id);
  }, [fetchDetail]);

  const updateStatus = useCallback(
    async (status: string) => {
      if (!record) return;
      try {
        const updated = await updateRecord(record.id, { status: status as any });
        setRecord(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar");
      }
    },
    [record]
  );

  const updateStage = useCallback(
    async (stage: string) => {
      if (!record) return;
      try {
        const updated = await updateRecord(record.id, { stage: stage as any });
        setRecord(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar");
      }
    },
    [record]
  );

  const updateRecordFields = useCallback(
    async (data: RecordCreate) => {
      if (!record) return;
      try {
        const updated = await updateRecordData(record.id, data);
        setRecord(updated);
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al editar candidato");
        return null;
      }
    },
    [record]
  );

  const addNewNote = useCallback(
    async (content: string) => {
      if (!record) return;
      try {
        const note = await addNote(record.id, { content });
        setNotes((prev) => [...prev, note]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al añadir nota");
      }
    },
    [record]
  );

  const removeNote = useCallback(
    async (noteId: string) => {
      if (!record) return;
      try {
        await deleteNote(record.id, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar nota");
      }
    },
    [record]
  );

  return {
    record,
    notes,
    loading,
    error,
    open,
    close,
    updateStatus,
    updateStage,
    updateRecordFields,
    addNewNote,
    removeNote,
  };
}

// ─── Create record hook ─────────────────────────────────────

export function useCreateRecord() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: RecordCreate) => {
    setLoading(true);
    setError(null);
    try {
      const record = await createRecord(data);
      return record;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear candidato");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}