"use client";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  stageFilter: string;
  onStageChange: (v: string) => void;
}

export default function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  stageFilter,
  onStageChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="search" className="block text-xs font-semibold text-nexova-muted mb-1">
          Buscar
        </label>
        <input
          id="search"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nombre o email..."
          className="w-full rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
        />
      </div>

      <div>
        <label htmlFor="status-filter" className="block text-xs font-semibold text-nexova-muted mb-1">
          Estado
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
        >
          <option value="">Todos</option>
          <option value="received">Recibida</option>
          <option value="in_progress">En proceso</option>
          <option value="selected">Seleccionada</option>
          <option value="discarded">Descartada</option>
        </select>
      </div>

      <div>
        <label htmlFor="stage-filter" className="block text-xs font-semibold text-nexova-muted mb-1">
          Etapa
        </label>
        <select
          id="stage-filter"
          value={stageFilter}
          onChange={(e) => onStageChange(e.target.value)}
          className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-sm shadow-sm focus:border-nexova-hover focus:outline-none focus:ring-2 focus:ring-nexova-accent"
        >
          <option value="">Todas</option>
          <option value="pending">Pendiente de revisión</option>
          <option value="review">En revisión</option>
          <option value="personal_interview">Entrevista personal</option>
          <option value="technical_interview">Entrevista técnica</option>
          <option value="offer_presented">Oferta presentada</option>
        </select>
      </div>
    </div>
  );
}