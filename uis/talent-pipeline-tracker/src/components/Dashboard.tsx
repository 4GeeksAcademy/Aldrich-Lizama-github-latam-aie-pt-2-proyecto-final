"use client";

import { useState, useMemo } from "react";
import { useRecords, useRecordDetail, useCreateRecord } from "@/hooks/useRecords";
import { deleteRecord } from "@/lib/api";
import { STATUS_LABELS, STAGE_LABELS } from "@/types";
import StatCard from "./StatCard";
import FilterBar from "./FilterBar";
import RecordsTable from "./RecordsTable";
import RecordDetail from "./RecordDetail";
import RecordForm from "./RecordForm";
import Pagination from "./Pagination";

export default function Dashboard() {
  const {
    records,
    allRecords,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    onPageChange,
    refresh,
  } = useRecords();

  const detail = useRecordDetail();
  const creator = useCreateRecord();

  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Stats — calculadas sobre allRecords (sin filtros) para reflejar valores reales
  const stats = useMemo(() => {
    const target = allRecords.length > 0 ? allRecords : records;
    const total = target.length;
    const received = target.filter((r) => r.status === "received").length;
    const inProgress = target.filter((r) => r.status === "in_progress").length;
    const selected = target.filter((r) => r.status === "selected").length;
    const discarded = target.filter((r) => r.status === "discarded").length;
    return { total, received, inProgress, selected, discarded };
  }, [allRecords, records]);

  const handleSelect = (id: string) => {
    detail.open(id);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRecord(deleteConfirm);
      await refresh();
    } catch (err) {
      console.error("Error al eliminar:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreate = async (data: any) => {
    const result = await creator.create(data);
    if (result) {
      setShowForm(false);
      await refresh();
    }
  };

  const handleEditSave = async (data: any) => {
    if (!editRecord) return;
    const updated = await detail.updateRecordFields(data);
    if (updated) {
      setEditRecord(null);
      await refresh();
    }
  };

  const handleEditRequest = () => {
    setEditRecord(detail.record);
  };

  return (
    <div className="mx-auto max-w-6xl w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Talent Pipeline Tracker</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>
          <p className="text-sm text-nexova-muted mt-1">
            Gestión de candidaturas — Nexova · Actualización en tiempo real vía SSE
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-nexova-text px-4 py-2 text-sm font-semibold text-nexova-bg hover:bg-nexova-hover transition-colors"
        >
          + Nuevo candidato
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon="📋" value={stats.total} label="Total candidatos" />
        <StatCard icon="📥" value={stats.received} label={STATUS_LABELS.received} />
        <StatCard icon="🔄" value={stats.inProgress} label={STATUS_LABELS.in_progress} />
        <StatCard icon="✅" value={stats.selected} label={STATUS_LABELS.selected} />
        <StatCard icon="❌" value={stats.discarded} label={STATUS_LABELS.discarded} />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          stageFilter={stageFilter}
          onStageChange={setStageFilter}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Creator error */}
      {creator.error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {creator.error}
        </div>
      )}

      {/* Table */}
      <RecordsTable
        records={records}
        loading={loading}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />

      {/* Paginación */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalRecords}
        onPageChange={onPageChange}
      />

      {/* Detail modal */}
      {detail.record && (
        <RecordDetail
          record={detail.record}
          notes={detail.notes}
          onClose={detail.close}
          onEdit={handleEditRequest}
          onUpdateStatus={detail.updateStatus}
          onUpdateStage={detail.updateStage}
          onAddNote={detail.addNewNote}
          onDeleteNote={detail.removeNote}
        />
      )}

      {/* Create form modal */}
      {showForm && (
        <RecordForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form modal */}
      {editRecord && (
        <RecordForm
          record={editRecord}
          onSubmit={handleEditSave}
          onCancel={() => setEditRecord(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-nexova-border bg-nexova-bg p-6 shadow-xl">
            <h3 className="text-lg font-bold">¿Eliminar candidato?</h3>
            <p className="text-sm text-nexova-muted mt-2">
              Esta acción no se puede deshacer. ¿Estás seguro?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-nexova-border px-4 py-2 text-sm font-semibold hover:bg-nexova-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}