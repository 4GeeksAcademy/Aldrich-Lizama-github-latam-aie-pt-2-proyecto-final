"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiClient } from "@/lib/apiClient";

type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";
type IncidentOrigin = "customer" | "branch" | "internal";
type IncidentBranch =
  "central" | "valencia_operations" | "miami_office" | "remote";
type IncidentCategory =
  | "technical_failure"
  | "process_error"
  | "client_complaint"
  | "candidate_issue"
  | "staff_issue"
  | "sla_breach"
  | "data_quality"
  | "other";
type IncidentField =
  "title" | "description" | "category" | "status" | "origin" | "branch";

interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

interface IncidentSummary {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_category: Record<IncidentCategory, number>;
  by_origin: Record<IncidentOrigin, number>;
  by_branch: Record<IncidentBranch, number>;
}

interface Filters {
  status: IncidentStatus | "";
  origin: IncidentOrigin | "";
  branch: IncidentBranch | "";
}

type FieldErrors = Partial<Record<IncidentField, string>>;

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En curso",
  resolved: "Resuelta",
  discarded: "Descartada",
};
const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  technical_failure: "Fallo técnico",
  process_error: "Error de proceso",
  client_complaint: "Queja de cliente",
  candidate_issue: "Problema de candidato",
  staff_issue: "Incidencia de personal",
  sla_breach: "Incumplimiento de SLA",
  data_quality: "Calidad de datos",
  other: "Otro",
};
const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Cliente",
  branch: "Sede",
  internal: "Interno",
};
const BRANCH_LABELS: Record<IncidentBranch, string> = {
  central: "Central — Sede Valencia",
  valencia_operations: "Valencia — Operaciones",
  miami_office: "Miami Office",
  remote: "Remoto",
};
const STATUS_VALUES = Object.keys(STATUS_LABELS) as IncidentStatus[];
const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as IncidentCategory[];
const ORIGIN_VALUES = Object.keys(ORIGIN_LABELS) as IncidentOrigin[];
const BRANCH_VALUES = Object.keys(BRANCH_LABELS) as IncidentBranch[];
const NEXT_STATUSES: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["open", "in_progress", "discarded"],
  in_progress: ["in_progress", "resolved", "discarded"],
  resolved: ["resolved"],
  discarded: ["discarded"],
};
const EMPTY_FORM = {
  title: "",
  description: "",
  category: "" as IncidentCategory | "",
  status: "open" as IncidentStatus,
  origin: "" as IncidentOrigin | "",
  branch: "" as IncidentBranch | "",
};

const FIELD_MESSAGES: Record<IncidentField, string> = {
  title: "Escribe un título breve para la incidencia.",
  description: "Añade una descripción de la incidencia.",
  category: "Selecciona una categoría válida.",
  status: "Selecciona un estado válido.",
  origin: "Selecciona quién reportó la incidencia.",
  branch: "Selecciona una sede válida.",
};

async function readFailure(response: Response): Promise<{
  fields: FieldErrors;
  message: string;
}> {
  const payload = (await response.json().catch(() => null)) as {
    detail?: { errors?: Array<{ field?: string }> };
  } | null;
  const fields: FieldErrors = {};

  for (const error of payload?.detail?.errors ?? []) {
    if (error.field && error.field in FIELD_MESSAGES) {
      const field = error.field as IncidentField;
      fields[field] = FIELD_MESSAGES[field];
    }
  }

  if (response.status === 401) {
    return {
      fields,
      message: "Tu sesión ha expirado. Inicia sesión de nuevo.",
    };
  }
  if (Object.keys(fields).length > 0) {
    return { fields, message: "Revisa los campos indicados." };
  }
  if (response.status === 404) {
    return {
      fields,
      message: "La incidencia ya no está disponible. Actualiza la lista.",
    };
  }
  if (response.status >= 500) {
    return {
      fields,
      message: "El servicio no está disponible. Inténtalo de nuevo más tarde.",
    };
  }
  return {
    fields,
    message:
      "No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.",
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetricBreakdown<T extends string>({
  title,
  values,
  labels,
}: {
  title: string;
  values: Record<T, number>;
  labels: Record<T, string>;
}) {
  return (
    <section className="card" aria-label={title}>
      <h3 style={{ margin: "0 0 0.75rem" }}>{title}</h3>
      <dl style={{ display: "grid", gap: "0.5rem", margin: 0 }}>
        {Object.entries(values).map(([key, count]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              borderBottom: "1px solid rgba(46, 77, 95, 0.45)",
              paddingBottom: "0.35rem",
            }}
          >
            <dt style={{ color: "var(--muted)" }}>{labels[key as T]}</dt>
            <dd
              style={{
                margin: 0,
                fontVariantNumeric: "tabular-nums",
                fontWeight: 700,
              }}
            >
              {count as number}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function IncidentManagerPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    origin: "",
    branch: "",
  });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listRetry, setListRetry] = useState(0);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryRetry, setSummaryRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const loadIncidents = async () => {
      const query = new URLSearchParams();
      if (filters.status) query.set("status", filters.status);
      if (filters.origin) query.set("origin", filters.origin);
      if (filters.branch) query.set("branch", filters.branch);
      const suffix = query.size ? `?${query.toString()}` : "";

      try {
        const response = await apiClient(`/api/incidents${suffix}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Request failed");
        const data = (await response.json()) as Incident[];
        if (!controller.signal.aborted) {
          setIncidents(data);
          setListError(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setListError(
            "No se pudieron cargar las incidencias. Comprueba la conexión e inténtalo de nuevo.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setListLoading(false);
      }
    };
    void loadIncidents();
    return () => controller.abort();
  }, [filters, listRetry]);

  useEffect(() => {
    const controller = new AbortController();
    const loadSummary = async () => {
      try {
        const response = await apiClient("/api/incidents/summary", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Request failed");
        const data = (await response.json()) as IncidentSummary;
        if (!controller.signal.aborted) {
          setSummary(data);
          setSummaryError(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSummaryError(
            "No se pudo cargar el resumen. Puedes volver a intentarlo.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setSummaryLoading(false);
      }
    };
    void loadSummary();
    return () => controller.abort();
  }, [summaryRetry]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const clientErrors: FieldErrors = {};
    if (!form.title.trim()) clientErrors.title = FIELD_MESSAGES.title;
    if (!form.description.trim()) {
      clientErrors.description = FIELD_MESSAGES.description;
    }
    if (!form.category) clientErrors.category = FIELD_MESSAGES.category;
    if (!form.origin) clientErrors.origin = FIELD_MESSAGES.origin;
    if (!form.branch) clientErrors.branch = FIELD_MESSAGES.branch;
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError("Completa los campos obligatorios para continuar.");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setCreatedMessage(null);

    try {
      const response = await apiClient("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description,
        }),
      });
      if (!response.ok) {
        const feedback = await readFailure(response);
        setFieldErrors(feedback.fields);
        setFormError(feedback.message);
        return;
      }

      setForm(EMPTY_FORM);
      setFieldErrors({});
      setCreatedMessage("Incidencia registrada correctamente.");
      setListLoading(true);
      setListRetry((value) => value + 1);
      setSummaryLoading(true);
      setSummaryRetry((value) => value + 1);
    } catch {
      setFormError("No se pudo registrar la incidencia. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    incident: Incident,
    nextStatus: IncidentStatus,
  ) => {
    const previousStatus = incident.status;
    if (previousStatus === nextStatus) return;

    setStatusError(null);
    setUpdatingIds((current) => [...current, incident.id]);
    setIncidents((current) =>
      current.map((item) =>
        item.id === incident.id ? { ...item, status: nextStatus } : item,
      ),
    );

    try {
      const response = await apiClient(
        `/api/incidents/${encodeURIComponent(incident.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      if (!response.ok) throw new Error("Status update failed");
      const updated = (await response.json()) as Incident;
      setIncidents((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSummaryLoading(true);
      setSummaryRetry((value) => value + 1);
    } catch {
      setIncidents((current) =>
        current.map((item) =>
          item.id === incident.id ? { ...item, status: previousStatus } : item,
        ),
      );
      setStatusError(
        `No se pudo actualizar el estado de “${incident.title}”. Se restauró el estado anterior.`,
      );
    } finally {
      setUpdatingIds((current) => current.filter((id) => id !== incident.id));
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setListLoading(true);
    setListError(null);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="wrapper--wide" style={{ padding: "1.5rem 0 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Gestor de Incidencias</h1>
        <p style={{ color: "var(--muted)", margin: "0.4rem 0 0" }}>
          Registro y seguimiento centralizado de incidencias de Nexova.
        </p>
      </header>

      <section aria-labelledby="incident-summary-heading">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <h2 id="incident-summary-heading" style={{ fontSize: "1.2rem" }}>
            Resumen
          </h2>
          {summaryError && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setSummaryLoading(true);
                setSummaryRetry((value) => value + 1);
              }}
            >
              Reintentar resumen
            </button>
          )}
        </div>
        {summaryLoading ? (
          <p role="status" aria-busy="true" style={{ color: "var(--muted)" }}>
            Cargando métricas…
          </p>
        ) : summaryError ? (
          <p role="alert" style={{ color: "var(--danger)" }}>
            {summaryError}
          </p>
        ) : summary ? (
          <>
            <p
              className="card"
              style={{ margin: "0 0 1rem", fontSize: "1.05rem" }}
            >
              Total de incidencias: <strong>{summary.total}</strong>
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              <MetricBreakdown
                title="Por estado"
                values={summary.by_status}
                labels={STATUS_LABELS}
              />
              <MetricBreakdown
                title="Por categoría"
                values={summary.by_category}
                labels={CATEGORY_LABELS}
              />
              <MetricBreakdown
                title="Por origen"
                values={summary.by_origin}
                labels={ORIGIN_LABELS}
              />
              <MetricBreakdown
                title="Por sede"
                values={summary.by_branch}
                labels={BRANCH_LABELS}
              />
            </div>
          </>
        ) : null}
      </section>

      <section
        aria-labelledby="incident-create-heading"
        style={{ marginTop: "2.5rem" }}
      >
        <h2 id="incident-create-heading" style={{ fontSize: "1.2rem" }}>
          Registrar incidencia
        </h2>
        <form
          onSubmit={handleCreate}
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Título
            <input
              name="title"
              required
              maxLength={120}
              value={form.title}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? "incident-title-error" : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }));
                setFieldErrors((current) => ({ ...current, title: undefined }));
              }}
            />
            {fieldErrors.title && (
              <span
                id="incident-title-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.title}
              </span>
            )}
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Categoría
            <select
              name="category"
              required
              value={form.category}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={
                fieldErrors.category ? "incident-category-error" : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  category: event.target.value as IncidentCategory | "",
                }));
                setFieldErrors((current) => ({
                  ...current,
                  category: undefined,
                }));
              }}
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {CATEGORY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <span
                id="incident-category-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.category}
              </span>
            )}
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Estado
            <select
              name="status"
              value={form.status}
              aria-invalid={Boolean(fieldErrors.status)}
              aria-describedby={
                fieldErrors.status ? "incident-form-status-error" : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  status: event.target.value as IncidentStatus,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  status: undefined,
                }));
              }}
            >
              {STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            {fieldErrors.status && (
              <span
                id="incident-form-status-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.status}
              </span>
            )}
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Origen
            <select
              name="origin"
              required
              value={form.origin}
              aria-invalid={Boolean(fieldErrors.origin)}
              aria-describedby={
                fieldErrors.origin ? "incident-origin-error" : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  origin: event.target.value as IncidentOrigin | "",
                }));
                setFieldErrors((current) => ({
                  ...current,
                  origin: undefined,
                }));
              }}
            >
              <option value="" disabled>
                Selecciona un origen
              </option>
              {ORIGIN_VALUES.map((value) => (
                <option key={value} value={value}>
                  {ORIGIN_LABELS[value]}
                </option>
              ))}
            </select>
            {fieldErrors.origin && (
              <span
                id="incident-origin-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.origin}
              </span>
            )}
          </label>
          <label
            style={{
              display: "grid",
              gap: "0.35rem",
              padding: form.origin === "branch" ? "0.65rem" : 0,
              border:
                form.origin === "branch"
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              borderRadius: "0.5rem",
              background:
                form.origin === "branch"
                  ? "rgba(126, 192, 167, 0.08)"
                  : "transparent",
            }}
          >
            Sede
            <select
              name="branch"
              required
              value={form.branch}
              aria-invalid={Boolean(fieldErrors.branch)}
              aria-describedby={
                fieldErrors.branch
                  ? "incident-branch-error"
                  : form.origin === "branch"
                    ? "incident-branch-hint"
                    : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  branch: event.target.value as IncidentBranch | "",
                }));
                setFieldErrors((current) => ({
                  ...current,
                  branch: undefined,
                }));
              }}
            >
              <option value="" disabled>
                Selecciona una sede
              </option>
              {BRANCH_VALUES.map((value) => (
                <option key={value} value={value}>
                  {BRANCH_LABELS[value]}
                </option>
              ))}
            </select>
            {form.origin === "branch" && (
              <span
                id="incident-branch-hint"
                style={{ color: "var(--accent)", fontSize: "0.8rem" }}
              >
                Indica la sede desde la que se reporta.
              </span>
            )}
            {fieldErrors.branch && (
              <span
                id="incident-branch-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.branch}
              </span>
            )}
          </label>
          <label
            style={{ display: "grid", gap: "0.35rem", gridColumn: "1 / -1" }}
          >
            Descripción
            <textarea
              name="description"
              required
              rows={4}
              value={form.description}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={
                fieldErrors.description
                  ? "incident-description-error"
                  : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  description: undefined,
                }));
              }}
            />
            {fieldErrors.description && (
              <span
                id="incident-description-error"
                role="alert"
                style={{ color: "var(--danger)" }}
              >
                {fieldErrors.description}
              </span>
            )}
          </label>
          {formError && (
            <p
              role="alert"
              style={{
                color: "var(--danger)",
                margin: 0,
                gridColumn: "1 / -1",
              }}
            >
              {formError}
            </p>
          )}
          {createdMessage && (
            <p
              role="status"
              style={{
                color: "var(--success)",
                margin: 0,
                gridColumn: "1 / -1",
              }}
            >
              {createdMessage}
            </p>
          )}
          <button
            className="btn btn--primary"
            type="submit"
            disabled={isSubmitting}
            style={{ width: "fit-content" }}
          >
            {isSubmitting ? "Registrando…" : "Registrar incidencia"}
          </button>
          <p
            style={{
              color: "var(--muted)",
              margin: 0,
              alignSelf: "center",
              fontSize: "0.8rem",
            }}
          >
            El identificador y las fechas se generan automáticamente.
          </p>
        </form>
      </section>

      <section
        aria-labelledby="incident-list-heading"
        style={{ marginTop: "2.5rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h2 id="incident-list-heading" style={{ fontSize: "1.2rem" }}>
            Incidencias registradas
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <label
              style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem" }}
            >
              Estado
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <option value="">Todos</option>
                {STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem" }}
            >
              Origen
              <select
                value={filters.origin}
                onChange={(event) => updateFilter("origin", event.target.value)}
              >
                <option value="">Todos</option>
                {ORIGIN_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {ORIGIN_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem" }}
            >
              Sede
              <select
                value={filters.branch}
                onChange={(event) => updateFilter("branch", event.target.value)}
              >
                <option value="">Todas</option>
                {BRANCH_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {BRANCH_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {statusError && (
          <p role="alert" style={{ color: "var(--danger)" }}>
            {statusError}
          </p>
        )}
        {listLoading ? (
          <p role="status" aria-busy="true" style={{ color: "var(--muted)" }}>
            Cargando incidencias…
          </p>
        ) : listError ? (
          <div
            className="card"
            role="alert"
            style={{ borderColor: "var(--danger)" }}
          >
            <p style={{ marginTop: 0 }}>{listError}</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setListLoading(true);
                setListRetry((value) => value + 1);
              }}
            >
              Reintentar
            </button>
          </div>
        ) : incidents.length === 0 ? (
          <p className="card" style={{ color: "var(--muted)" }}>
            No hay incidencias que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div
            className="card"
            style={{ overflowX: "auto", padding: "0.5rem" }}
          >
            <table>
              <thead>
                <tr>
                  <th>Incidencia</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th>Sede</th>
                  <th>Creada</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td style={{ minWidth: 240 }}>
                      <strong>{incident.title}</strong>
                      <div
                        style={{
                          color: "var(--muted)",
                          marginTop: "0.25rem",
                          maxWidth: 420,
                        }}
                      >
                        {incident.description}
                      </div>
                    </td>
                    <td>{CATEGORY_LABELS[incident.category]}</td>
                    <td>
                      <select
                        aria-label={`Estado de ${incident.title}`}
                        value={incident.status}
                        disabled={updatingIds.includes(incident.id)}
                        onChange={(event) =>
                          void handleStatusChange(
                            incident,
                            event.target.value as IncidentStatus,
                          )
                        }
                      >
                        {NEXT_STATUSES[incident.status].map((value) => (
                          <option key={value} value={value}>
                            {STATUS_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      {updatingIds.includes(incident.id) && (
                        <span
                          role="status"
                          style={{
                            display: "block",
                            color: "var(--muted)",
                            fontSize: "0.75rem",
                          }}
                        >
                          Guardando…
                        </span>
                      )}
                    </td>
                    <td>{ORIGIN_LABELS[incident.origin]}</td>
                    <td>{BRANCH_LABELS[incident.branch]}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(incident.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
