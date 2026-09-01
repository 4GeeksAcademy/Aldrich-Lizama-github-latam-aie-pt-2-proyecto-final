"use client";

// ────────────────────────────────────────────────────────────
//  suppliers/page.tsx — Directorio de Proveedores
//  Diseño renovado con Lucide icons y mejor composición.
// ────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, X, CheckCircle, XCircle, AlertTriangle,
  DollarSign, Trash2, EyeOff, Eye, Search,
  RefreshCw, Globe, Calendar, Clock, Building2,
  MapPin, Tag, Filter, Loader2,
} from "lucide-react";
import type {
  Supplier,
  SupplierCreatePayload,
} from "./types";
import { VALID_CATEGORIES, VALID_COUNTRIES } from "./types";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplierRate,
  updateSupplierStatus,
  deleteSupplier,
} from "./api";

// ── Helpers ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  job_boards: "Bolsa de empleo",
  ats_software: "ATS",
  assessment_tools: "Evaluación",
  training_platforms: "Formación",
  payroll_and_hr_software: "Nóminas / RRHH",
  video_interview: "Entrevista en vídeo",
  background_check: "Verificación",
  office_and_facilities: "Oficina",
  it_and_software_licenses: "TI / Licencias",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Calcula si la renovación está dentro de los próximos 60 días. */
function isRenewalSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const renewal = new Date(dateStr + "T00:00:00");
  if (isNaN(renewal.getTime())) return false;
  const now = new Date();
  const diffMs = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 60;
}

// ── Componente principal ─────────────────────────────────

export default function SuppliersPage() {
  // ── Estado ──────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  // Modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal de tarifa
  const [rateModal, setRateModal] = useState<{
    supplier: Supplier;
  } | null>(null);

  // Modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null);

  // ── Cargar datos ───────────────────────────────────────
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSuppliers(
        filterCountry || undefined,
        filterCategory || undefined,
      );
      setSuppliers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar proveedores";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterCategory]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // ── Crear proveedor ────────────────────────────────────
  const handleCreate = async (payload: SupplierCreatePayload) => {
    await createSupplier(payload);
    setShowCreateModal(false);
    await loadSuppliers();
  };

  // ── Toggle status ──────────────────────────────────────
  const handleToggleStatus = async (supplier: Supplier) => {
    const newStatus = supplier.status === "active" ? "suspended" : "active";
    await updateSupplierStatus(supplier.id, { status: newStatus });
    await loadSuppliers();
  };

  // ── Actualizar tarifa ───────────────────────────────────
  const handleUpdateRate = async (id: string, monthlyRate: number) => {
    await updateSupplierRate(id, { monthly_rate: monthlyRate });
    setRateModal(null);
    await loadSuppliers();
  };

  // ── Eliminar (soft-delete) ─────────────────────────────
  const handleDelete = async (supplier: Supplier) => {
    await deleteSupplier(supplier.id);
    setConfirmDelete(null);
    await loadSuppliers();
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <main className="wrapper--wide" style={{ padding: "0 0 2rem" }}>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={24} style={{ color: "var(--accent)" }} />
            Directorio de Proveedores
          </h1>
          <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
            Registro oficial de proveedores externos de Nexova.
          </p>
        </div>

        <button
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* Barra de resumen */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div className="card" style={{ flex: 1, minWidth: "140px", textAlign: "center", padding: "0.75rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
            {suppliers.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>
            Total proveedores
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: "140px", textAlign: "center", padding: "0.75rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
            {suppliers.filter((s) => s.status === "active").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>
            Activos
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: "140px", textAlign: "center", padding: "0.75rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1c40f" }}>
            {suppliers.filter((s) => isRenewalSoon(s.contract_renewal_date)).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>
            Renovación próxima
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: "140px", textAlign: "center", padding: "0.75rem 1rem" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--muted)" }}>
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
              suppliers.reduce((sum, s) => sum + s.monthly_rate, 0)
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>
            Gasto mensual total
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          alignItems: "center",
          padding: "0.75rem 1rem",
        }}
      >
        <Filter size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={selectStyle}
          aria-label="Filtrar por país"
        >
          <option value="">Todos los países</option>
          {VALID_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c === "Spain" ? "España" : "USA"}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={selectStyle}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {VALID_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] ?? cat}
            </option>
          ))}
        </select>

        {(filterCountry || filterCategory) && (
          <button
            onClick={() => {
              setFilterCountry("");
              setFilterCategory("");
            }}
            className="btn btn--ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
          >
            <RefreshCw size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="card"
          style={{
            borderColor: "#e74c3c",
            background: "rgba(231, 76, 60, 0.1)",
            color: "#e74c3c",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Tabla / lista */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: "3rem 2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem" }}>
            <Loader2 size={24} className="spinner" />
            <span>Cargando proveedores…</span>
          </div>
          <style>{`.spinner { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: "3rem 2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
            <Building2 size={32} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0 }}>
              {filterCountry || filterCategory
                ? "No hay proveedores que coincidan con los filtros seleccionados."
                : "Aún no hay proveedores registrados. ¡Agrega el primero!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ fontSize: "0.85rem", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Proveedor</th>
                  <th style={thStyle}>País</th>
                  <th style={thStyle}>Categorías</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Tarifa</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Renovación</th>
                  <th className="hide-mobile" style={thStyle}>Actualización</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
              {suppliers.map((supplier) => {
                const renewalSoon = isRenewalSoon(supplier.contract_renewal_date);
                return (
                  <tr key={supplier.id} style={{ transition: "background 0.15s ease" }}>
                    <td style={tdStyle}>
                      <strong>{supplier.name}</strong>
                      {supplier.notes && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: "var(--muted)",
                            marginTop: "0.2rem",
                          }}
                        >
                          {supplier.notes}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}>
                        <Globe size={12} style={{ opacity: 0.5 }} />
                        {supplier.country === "Spain" ? "España" : "USA"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {supplier.categories.map((cat) => (
                          <span key={cat} style={badgeStyle}>
                            {CATEGORY_LABELS[cat] ?? cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {formatCurrency(supplier.monthly_rate, supplier.currency)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...statusBadgeStyle,
                          background:
                            supplier.status === "active"
                              ? "rgba(126, 192, 167, 0.15)"
                              : "rgba(231, 76, 60, 0.15)",
                          color:
                            supplier.status === "active"
                              ? "var(--accent)"
                              : "#e74c3c",
                          borderColor:
                            supplier.status === "active"
                              ? "rgba(126, 192, 167, 0.3)"
                              : "rgba(231, 76, 60, 0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        {supplier.status === "active"
                          ? <><CheckCircle size={12} /> Activo</>
                          : <><XCircle size={12} /> Suspendido</>
                        }
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {supplier.contract_renewal_date ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          {supplier.contract_renewal_date}
                          {renewalSoon && (
                            <span
                              style={{
                                ...renewalBadgeStyle,
                                background: "rgba(241, 196, 15, 0.15)",
                                color: "#f1c40f",
                                borderColor: "rgba(241, 196, 15, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                              }}
                              title="Renovación próxima (dentro de 60 días)"
                            >
                              <AlertTriangle size={10} />
                              Próxima
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="hide-mobile" style={{ ...tdStyle, fontSize: "0.85rem", color: "var(--muted)" }}>
                      {new Date(supplier.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "nowrap" }}>
                        {/* Toggle status */}
                        <button
                          onClick={() => handleToggleStatus(supplier)}
                          title={
                            supplier.status === "active"
                              ? "Suspender proveedor"
                              : "Activar proveedor"
                          }
                          style={{
                            ...actionBtnStyle,
                            color: supplier.status === "active" ? "#f1c40f" : "var(--accent)",
                            borderColor: supplier.status === "active"
                              ? "rgba(241, 196, 15, 0.3)"
                              : "rgba(126, 192, 167, 0.2)",
                            padding: "0.35rem 0.5rem",
                            lineHeight: 1,
                          }}
                        >
                          {supplier.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        {/* Editar tarifa */}
                        <button
                          onClick={() => setRateModal({ supplier })}
                          title="Actualizar tarifa mensual"
                          style={{
                            ...actionBtnStyle,
                            padding: "0.35rem 0.5rem",
                            lineHeight: 1,
                          }}
                        >
                          <DollarSign size={14} />
                        </button>

                        {/* Eliminar (soft-delete) */}
                        <button
                          onClick={() => setConfirmDelete(supplier)}
                          title="Deshabilitar proveedor"
                          style={{
                            ...actionBtnStyle,
                            color: "#e74c3c",
                            borderColor: "rgba(231, 76, 60, 0.3)",
                            padding: "0.35rem 0.5rem",
                            lineHeight: 1,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── Modal de creación ────────────────────────── */}
      {showCreateModal && (
        <Modal title="Registrar nuevo proveedor" onClose={() => setShowCreateModal(false)}>
          <CreateForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* ── Modal de tarifa ──────────────────────────── */}
      {rateModal && (
        <Modal title={`Actualizar tarifa — ${rateModal.supplier.name}`} onClose={() => setRateModal(null)}>
          <RateForm
            currentRate={rateModal.supplier.monthly_rate}
            currency={rateModal.supplier.currency}
            onSubmit={(rate) => handleUpdateRate(rateModal.supplier.id, rate)}
            onCancel={() => setRateModal(null)}
          />
        </Modal>
      )}

      {/* ── Modal de confirmación de eliminación ────────── */}
      {confirmDelete && (
        <Modal
          title="Deshabilitar proveedor"
          onClose={() => setConfirmDelete(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas deshabilitar al proveedor{" "}
              <strong>{confirmDelete.name}</strong>?
            </p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
              El proveedor quedará oculto del listado principal, pero sus datos
              se conservarán en el registro interno.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                justifyContent: "flex-end",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn btn--ghost"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="btn btn--danger"
              >
                Sí, deshabilitar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

// ══════════════════════════════════════════════════════════
//  Componentes internos
// ══════════════════════════════════════════════════════════

// ── Modal genérico ───────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "modalIn 0.2s ease",
        }}
      >
        <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0.25rem",
              borderRadius: "0.4rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Formulario de creación ──────────────────────────────

function CreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: SupplierCreatePayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SupplierCreatePayload>({
    name: "",
    country: "Spain",
    categories: [],
    monthly_rate: 0,
    currency: "EUR",
    status: "active",
    contract_renewal_date: "",
    contact_email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto‑asignar moneda según país
      if (name === "country") {
        updated.currency = value === "Spain" ? "EUR" : "USD";
      }
      return updated;
    });
  };

  const addCategory = () => {
    if (!selectedCat || form.categories.includes(selectedCat)) return;
    setForm((prev) => ({ ...prev, categories: [...prev.categories, selectedCat] }));
    setSelectedCat("");
  };

  const removeCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== cat),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear proveedor";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {apiError && (
        <div
          style={{
            background: "rgba(231, 76, 60, 0.1)",
            color: "#e74c3c",
            padding: "0.6rem",
            borderRadius: "0.5rem",
            marginBottom: "0.8rem",
            fontSize: "0.85rem",
          }}
        >
          {apiError}
        </div>
      )}

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Nombre *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          style={inputStyle}
          placeholder="Ej: LinkedIn Talent Solutions"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>País *</label>
        <select
          name="country"
          value={form.country}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="Spain">España</option>
          <option value="USA">USA</option>
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Categorías *</label>
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">Seleccionar categoría…</option>
            {VALID_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} disabled={form.categories.includes(cat)}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCategory}
            disabled={!selectedCat}
            style={{
              background: "var(--accent)",
              color: "#0f1b24",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.3rem 0.8rem",
              cursor: selectedCat ? "pointer" : "not-allowed",
              opacity: selectedCat ? 1 : 0.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.85rem",
            }}
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
        {form.categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {form.categories.map((cat) => (
              <span key={cat} style={badgeStyle}>
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    marginLeft: "0.3rem",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  aria-label={`Eliminar ${cat}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {form.categories.length === 0 && (
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            Selecciona al menos una categoría.
          </span>
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Tarifa mensual *</label>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input
            name="monthly_rate"
            type="number"
            step="0.01"
            min="0.01"
            value={form.monthly_rate || ""}
            onChange={handleChange}
            required
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Ej: 1200.00"
          />
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {form.currency}
          </span>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Estado *</label>
        <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Fecha de renovación</label>
        <input
          name="contract_renewal_date"
          type="date"
          value={form.contract_renewal_date ?? ""}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Email de contacto</label>
        <input
          name="contact_email"
          type="email"
          value={form.contact_email ?? ""}
          onChange={handleChange}
          style={inputStyle}
          placeholder="account@proveedor.com"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Notas</label>
        <textarea
          name="notes"
          value={form.notes ?? ""}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          placeholder="Observaciones internas…"
        />
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1rem" }}>
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn--ghost">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting || form.categories.length === 0}
          className="btn btn--primary"
          style={{ opacity: submitting || form.categories.length === 0 ? 0.6 : 1 }}
        >
          {submitting ? "Guardando…" : "Guardar proveedor"}
        </button>
      </div>
    </form>
  );
}

// ── Formulario de tarifa ─────────────────────────────────

function RateForm({
  currentRate,
  currency,
  onSubmit,
  onCancel,
}: {
  currentRate: number;
  currency: string;
  onSubmit: (rate: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [rate, setRate] = useState(currentRate);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rate <= 0) {
      setApiError("La tarifa debe ser mayor que 0.");
      return;
    }
    setSubmitting(true);
    setApiError(null);
    try {
      await onSubmit(rate);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar tarifa";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {apiError && (
        <div
          style={{
            background: "rgba(231, 76, 60, 0.1)",
            color: "#e74c3c",
            padding: "0.6rem",
            borderRadius: "0.5rem",
            marginBottom: "0.8rem",
            fontSize: "0.85rem",
          }}
        >
          {apiError}
        </div>
      )}

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Tarifa actual: <strong>{formatCurrency(currentRate, currency)}</strong>
        </label>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={rate || ""}
            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
            required
            autoFocus
            style={{ ...inputStyle, flex: 1 }}
          />
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{currency}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1rem" }}>
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn--ghost">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn--primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Actualizando…" : "Actualizar tarifa"}
        </button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════
//  Estilos inline (siguiendo convenciones del proyecto)
// ══════════════════════════════════════════════════════════

const tableStyle: React.CSSProperties = {
  fontSize: "0.85rem",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 0.5rem",
  color: "var(--muted)",
  fontWeight: 600,
  whiteSpace: "nowrap",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle: React.CSSProperties = {
  padding: "0.6rem 0.5rem",
  verticalAlign: "middle",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.2rem",
  fontSize: "0.72rem",
  padding: "0.15rem 0.45rem",
  borderRadius: "0.4rem",
  background: "rgba(126, 192, 167, 0.1)",
  color: "var(--accent)",
  border: "1px solid rgba(126, 192, 167, 0.2)",
  whiteSpace: "nowrap",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  fontSize: "0.75rem",
  padding: "0.2rem 0.6rem",
  borderRadius: "0.4rem",
  border: "1px solid",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const renewalBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.2rem",
  fontSize: "0.7rem",
  padding: "0.15rem 0.4rem",
  borderRadius: "0.3rem",
  border: "1px solid",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const actionBtnStyle: React.CSSProperties = {
  background: "rgba(126, 192, 167, 0.08)",
  color: "var(--accent)",
  border: "1px solid rgba(126, 192, 167, 0.2)",
  borderRadius: "0.4rem",
  padding: "0.35rem 0.5rem",
  cursor: "pointer",
  fontSize: "0.75rem",
  lineHeight: 1,
  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
};

const selectStyle: React.CSSProperties = {
  background: "var(--card)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "0.6rem",
  padding: "0.5rem 0.8rem",
  fontSize: "0.85rem",
  minWidth: "160px",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--card)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  padding: "0.5rem 0.7rem",
  fontSize: "0.85rem",
  fontFamily: "inherit",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: "0.8rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "var(--muted)",
  marginBottom: "0.25rem",
  fontWeight: 500,
};