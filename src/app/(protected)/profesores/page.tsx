"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import type { ProfessorTableRow } from "@/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEye,
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  EnrollProfessorModal,
  ProfessorProfileModal,
  DeleteProfessorModal,
} from "@/frontend/components/professors";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  INSCRITO: { dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
  ACTIVO: { dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
  GRADUADO: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  "BAJA TEMPORAL": { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  "BAJA DEFINITIVA": { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  DESHABILITADO: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS["ACTIVO"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A154A] text-xs font-bold text-white">
      {initials}
    </div>
  );
}

function formatTitle(degree: string | null): string {
  if (!degree) return "";
  const d = degree.toLowerCase();
  if (d.includes("doctor")) return "Dr. ";
  if (d.includes("maestr")) return "M. ";
  if (d.includes("ingenier")) return "Ing. ";
  if (d.includes("licencia")) return "Lic. ";
  return "";
}

export default function ProfesoresPage() {
  const { token } = useAuth();
  const [professors, setProfessors] = useState<ProfessorTableRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Modal state
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeProfessorId, setActiveProfessorId] = useState<number>(0);

  const fetchProfessors = useCallback(
    async (page: number) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/professors?page=${page}&limit=${meta.limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setProfessors(json.data);
          setMeta(json.meta);
        }
      } catch (err) {
        console.error("Fetch professors error:", err);
      } finally {
        setLoading(false);
      }
    },
    [token, meta.limit]
  );

  useEffect(() => {
    fetchProfessors(1);
  }, [fetchProfessors]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === professors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(professors.map((p) => p.id)));
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > meta.totalPages) return;
    setSelected(new Set());
    fetchProfessors(page);
  };

  const pageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const total = meta.totalPages;
    const current = meta.page;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  const getFirstSelectedId = () => {
    const first = Array.from(selected)[0];
    return first ?? 0;
  };

  const handleModalSuccess = () => {
    setSelected(new Set());
    fetchProfessors(meta.page);
  };

  const openProfile = (id: number) => {
    setActiveProfessorId(id);
    setProfileOpen(true);
  };

  const openDelete = () => {
    setActiveProfessorId(getFirstSelectedId());
    setDeleteOpen(true);
  };

  const openVisualize = () => {
    setActiveProfessorId(getFirstSelectedId());
    setProfileOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            Gestión de Profesores
          </h1>
          <p className="mt-1 text-sm text-gray-500 lg:text-base">
            Administra los profesores registrados.
          </p>
        </div>
        <button
          onClick={() => setEnrollOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5e1039] lg:px-5"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="hidden sm:inline">Inscribir</span>
        </button>
      </div>

      {/* Action bar */}
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="w-fit rounded-lg bg-[#7A154A] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openVisualize}
              className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5e1039]"
            >
              <FontAwesomeIcon icon={faEye} />
              Visualizar
            </button>
            <button
              onClick={openDelete}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faTrash} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
        </div>
      ) : professors.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-400">No hay profesores registrados.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: Card layout ── */}
          <div className="space-y-3 lg:hidden">
            <label className="flex items-center gap-2 px-1 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={professors.length > 0 && selected.size === professors.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
              />
              Seleccionar todos
            </label>

            {professors.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                  selected.has(p.id) ? "border-[#7A154A]/30 bg-rose-50/40" : "border-gray-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#7A154A]"
                  />
                  <Avatar initials={p.initials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {formatTitle(p.academicDegree)}{p.name} {p.lastName}
                      </p>
                      <StatusBadge status={p.statusType} />
                    </div>
                    <p className="mt-0.5 font-mono text-sm text-gray-500">{p.employeeNumber}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">{p.programName}</span>
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {p.academicLoad} HRS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: Table layout ── */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 pl-5 pr-2">
                    <input
                      type="checkbox"
                      checked={professors.length > 0 && selected.size === professors.length}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Profesor</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Matrícula</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Programa</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Carga Académica</th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {professors.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openProfile(p.id)}
                    className={`border-b border-gray-50 cursor-pointer transition ${
                      selected.has(p.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="py-4 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={p.initials} />
                        <span className="font-medium text-gray-900">
                          {formatTitle(p.academicDegree)}{p.name} {p.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-gray-600">{p.employeeNumber}</td>
                    <td className="px-4 py-4 text-gray-600">{p.programName}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-700">{p.academicLoad}</span>
                      <span className="ml-1 text-xs text-gray-400">HRS</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.statusType} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <span className="text-sm text-gray-500">
                Mostrando {startItem}-{endItem} de {meta.total} profesores
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
                {pageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                        p === meta.page ? "bg-[#7A154A] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <EnrollProfessorModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <ProfessorProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSuccess={handleModalSuccess}
        professorId={activeProfessorId}
      />
      <DeleteProfessorModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleModalSuccess}
        professorId={activeProfessorId}
      />
    </div>
  );
}
