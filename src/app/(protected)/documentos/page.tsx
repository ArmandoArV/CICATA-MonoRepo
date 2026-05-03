"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import type { StudentTableRow, ProfessorTableRow } from "@/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import GenerateDocumentModal from "@/frontend/components/documents/GenerateDocumentModal";
import MembretadoTab from "@/frontend/components/documents/MembretadoTab";

type Tab = "estudiantes" | "profesores" | "membretado";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 0 };

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

function usePagination(meta: Meta) {
  const pageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const { totalPages: total, page: current } = meta;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return { pageNumbers, start, end };
}

function PaginationBar({ meta, onPage, label }: { meta: Meta; onPage: (p: number) => void; label: string }) {
  const { pageNumbers, start, end } = usePagination(meta);
  if (meta.total === 0) return null;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <span className="text-sm text-gray-500">Mostrando {start}-{end} de {meta.total} {label}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30">
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        {pageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${p === meta.page ? "bg-[#7A154A] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30">
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("estudiantes");

  // Student state
  const [students, setStudents] = useState<StudentTableRow[]>([]);
  const [stuMeta, setStuMeta] = useState<Meta>(DEFAULT_META);
  const [stuSelected, setStuSelected] = useState<Set<number>>(new Set());
  const [stuLoading, setStuLoading] = useState(true);

  // Professor state
  const [professors, setProfessors] = useState<ProfessorTableRow[]>([]);
  const [profMeta, setProfMeta] = useState<Meta>(DEFAULT_META);
  const [profSelected, setProfSelected] = useState<Set<number>>(new Set());
  const [profLoading, setProfLoading] = useState(true);

  // Modal state
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<"student" | "professor">("student");
  const [generateEntityId, setGenerateEntityId] = useState<number>(0);

  const fetchStudents = useCallback(async (page: number) => {
    if (!token) return;
    setStuLoading(true);
    try {
      const res = await fetch(`/api/students?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { setStudents(json.data); setStuMeta(json.meta); }
    } catch (err) { console.error(err); } finally { setStuLoading(false); }
  }, [token]);

  const fetchProfessors = useCallback(async (page: number) => {
    if (!token) return;
    setProfLoading(true);
    try {
      const res = await fetch(`/api/professors?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { setProfessors(json.data); setProfMeta(json.meta); }
    } catch (err) { console.error(err); } finally { setProfLoading(false); }
  }, [token]);

  useEffect(() => { fetchStudents(1); }, [fetchStudents]);
  useEffect(() => { fetchProfessors(1); }, [fetchProfessors]);

  const toggleSet = (set: Set<number>, id: number) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const handleGenerate = () => {
    if (tab === "estudiantes" && stuSelected.size === 1) {
      setGenerateTarget("student");
      setGenerateEntityId([...stuSelected][0]);
      setShowGenerate(true);
    } else if (tab === "profesores" && profSelected.size === 1) {
      setGenerateTarget("professor");
      setGenerateEntityId([...profSelected][0]);
      setShowGenerate(true);
    }
  };

  const currentSelected = tab === "estudiantes" ? stuSelected : profSelected;

  const TABS: { key: Tab; label: string }[] = [
    { key: "estudiantes", label: "Estudiantes" },
    { key: "profesores", label: "Profesores" },
    { key: "membretado", label: "Membretado" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generación de documentos</h1>
        <p className="mt-1 text-sm text-gray-500">Gestión administrativa de trámites institucionales.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative pb-3 text-sm font-semibold transition ${
              tab === t.key ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#7A154A]" />
            )}
          </button>
        ))}
      </div>

      {/* Action bar */}
      {tab !== "membretado" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {currentSelected.size > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white">
              {currentSelected.size} SELECCIONADO{currentSelected.size > 1 ? "S" : ""}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={handleGenerate}
            disabled={currentSelected.size !== 1}
            className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlus} />
            Generar Documento
          </button>
        </div>
      )}

      {/* ═══ ESTUDIANTES TAB ═══ */}
      {tab === "estudiantes" && (
        <>
          {stuLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A154A]" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No hay estudiantes registrados.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 pl-5 pr-2 w-10" />
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Estudiante</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Matrícula</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Programa</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ciclo Académico</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b border-gray-50 transition ${stuSelected.has(s.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="py-4 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={stuSelected.has(s.id)}
                            onChange={() => setStuSelected(toggleSet(stuSelected, s.id))}
                            className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={s.initials} />
                            <span className="font-medium text-gray-900">{s.name} {s.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-gray-600">{s.registration}</td>
                        <td className="px-4 py-4 text-gray-600">{s.programName}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                            {s.cycleName}
                          </span>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={s.statusType} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                meta={stuMeta}
                onPage={(p) => { setStuSelected(new Set()); fetchStudents(p); }}
                label="estudiantes"
              />
            </>
          )}
        </>
      )}

      {/* ═══ PROFESORES TAB ═══ */}
      {tab === "profesores" && (
        <>
          {profLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A154A]" />
            </div>
          ) : professors.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No hay profesores registrados.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 pl-5 pr-2 w-10" />
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
                        className={`border-b border-gray-50 transition ${profSelected.has(p.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="py-4 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={profSelected.has(p.id)}
                            onChange={() => setProfSelected(toggleSet(profSelected, p.id))}
                            className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar initials={p.initials} />
                            <span className="font-medium text-gray-900">
                              {p.academicDegree ? `${p.academicDegree} ` : ""}{p.name} {p.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-gray-600">{p.employeeNumber}</td>
                        <td className="px-4 py-4 text-gray-600">{p.programName}</td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-700">{p.academicLoad} HRS</span>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={p.statusType} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                meta={profMeta}
                onPage={(p) => { setProfSelected(new Set()); fetchProfessors(p); }}
                label="profesores"
              />
            </>
          )}
        </>
      )}

      {/* ═══ MEMBRETADO TAB ═══ */}
      {tab === "membretado" && <MembretadoTab token={token} />}

      {/* ═══ Generate Document Modal ═══ */}
      <GenerateDocumentModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        target={generateTarget}
        entityId={generateEntityId}
        token={token}
      />
    </div>
  );
}
