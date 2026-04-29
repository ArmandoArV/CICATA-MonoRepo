"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { cn } from "@/frontend/utils";
import type { SubjectTableRow, GroupTableRow } from "@/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ActiveTab = "materias" | "grupos";

/* ── Pagination ── */
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

function PaginationBar({
  meta,
  onPage,
  label,
}: {
  meta: Meta;
  onPage: (p: number) => void;
  label: string;
}) {
  const { pageNumbers, start, end } = usePagination(meta);
  if (meta.total === 0) return null;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <span className="text-sm text-gray-500">
        Mostrando {start}-{end} de {meta.total} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        {pageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                p === meta.page ? "bg-[#7A154A] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function GruposMateriasPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<ActiveTab>("materias");

  // Materias state
  const [subjects, setSubjects] = useState<SubjectTableRow[]>([]);
  const [subMeta, setSubMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [subSelected, setSubSelected] = useState<Set<number>>(new Set());
  const [subLoading, setSubLoading] = useState(true);

  // Grupos state
  const [groups, setGroups] = useState<GroupTableRow[]>([]);
  const [grpMeta, setGrpMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [grpSelected, setGrpSelected] = useState<Set<number>>(new Set());
  const [grpLoading, setGrpLoading] = useState(true);

  const fetchSubjects = useCallback(
    async (page: number) => {
      if (!token) return;
      setSubLoading(true);
      try {
        const res = await fetch(`/api/subjects?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) { setSubjects(json.data); setSubMeta(json.meta); }
      } catch (err) { console.error(err); }
      finally { setSubLoading(false); }
    },
    [token]
  );

  const fetchGroups = useCallback(
    async (page: number) => {
      if (!token) return;
      setGrpLoading(true);
      try {
        const res = await fetch(`/api/groups?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) { setGroups(json.data); setGrpMeta(json.meta); }
      } catch (err) { console.error(err); }
      finally { setGrpLoading(false); }
    },
    [token]
  );

  useEffect(() => { fetchSubjects(1); }, [fetchSubjects]);
  useEffect(() => { fetchGroups(1); }, [fetchGroups]);

  const toggleSet = (set: Set<number>, id: number) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  };

  const selected = tab === "materias" ? subSelected : grpSelected;
  const setSelected = tab === "materias" ? setSubSelected : setGrpSelected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            Administración de Grupos y Materias
          </h1>
          <p className="mt-1 text-sm text-gray-500 lg:text-base">
            Gestiona el catálogo de materias y grupos.
          </p>
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5e1039] lg:px-5">
          <FontAwesomeIcon icon={faPlus} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["materias", "grupos"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold capitalize transition",
              tab === t
                ? "border-b-2 border-[#7A154A] text-[#7A154A]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Action bar */}
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="w-fit rounded-lg bg-[#7A154A] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5e1039]">
              <FontAwesomeIcon icon={faPen} />
              Editar
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <FontAwesomeIcon icon={faTrash} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* ═══ Materias Tab ═══ */}
      {tab === "materias" && (
        <>
          {subLoading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
              <p className="text-gray-400">No hay materias registradas.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                <label className="flex items-center gap-2 px-1 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={subjects.length > 0 && subSelected.size === subjects.length}
                    onChange={() =>
                      setSubSelected(
                        subSelected.size === subjects.length
                          ? new Set()
                          : new Set(subjects.map((s) => s.id))
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                  />
                  Seleccionar todas
                </label>
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                      subSelected.has(s.id) ? "border-[#7A154A]/30 bg-rose-50/40" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={subSelected.has(s.id)}
                        onChange={() => setSubSelected(toggleSet(subSelected, s.id))}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#7A154A]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="mt-0.5 font-mono text-sm text-gray-500">{s.subjectKey}</p>
                        <span className="mt-2 inline-block rounded-full border border-[#7A154A]/20 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-[#7A154A]">
                          {s.credits} créditos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={subjects.length > 0 && subSelected.size === subjects.length}
                          onChange={() =>
                            setSubSelected(
                              subSelected.size === subjects.length
                                ? new Set()
                                : new Set(subjects.map((s) => s.id))
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                        />
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Materia</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Clave</th>
                      <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Número de Créditos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b border-gray-50 transition ${
                          subSelected.has(s.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="py-4 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={subSelected.has(s.id)}
                            onChange={() => setSubSelected(toggleSet(subSelected, s.id))}
                            className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-4 font-mono text-gray-600">{s.subjectKey}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="rounded-full border border-[#7A154A]/20 bg-rose-50 px-3 py-1 text-xs font-semibold text-[#7A154A]">
                            {s.credits} créditos
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                meta={subMeta}
                onPage={(p) => { setSubSelected(new Set()); fetchSubjects(p); }}
                label="materias"
              />
            </>
          )}
        </>
      )}

      {/* ═══ Grupos Tab ═══ */}
      {tab === "grupos" && (
        <>
          {grpLoading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
              <p className="text-gray-400">No hay grupos registrados.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                <label className="flex items-center gap-2 px-1 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={groups.length > 0 && grpSelected.size === groups.length}
                    onChange={() =>
                      setGrpSelected(
                        grpSelected.size === groups.length
                          ? new Set()
                          : new Set(groups.map((g) => g.id))
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                  />
                  Seleccionar todos
                </label>
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                      grpSelected.has(g.id) ? "border-[#7A154A]/30 bg-rose-50/40" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={grpSelected.has(g.id)}
                        onChange={() => setGrpSelected(toggleSet(grpSelected, g.id))}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#7A154A]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{g.subjectName}</p>
                        <p className="mt-0.5 font-mono text-sm text-gray-500">{g.groupKey}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{g.professorName}</span>
                          <span>·</span>
                          <span>{g.campus}</span>
                          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-600">
                            {g.cycleName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={groups.length > 0 && grpSelected.size === groups.length}
                          onChange={() =>
                            setGrpSelected(
                              grpSelected.size === groups.length
                                ? new Set()
                                : new Set(groups.map((g) => g.id))
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                        />
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Grupo</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Materia</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Profesor</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Campus</th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Ciclo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr
                        key={g.id}
                        className={`border-b border-gray-50 transition ${
                          grpSelected.has(g.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="py-4 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={grpSelected.has(g.id)}
                            onChange={() => setGrpSelected(toggleSet(grpSelected, g.id))}
                            className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]"
                          />
                        </td>
                        <td className="px-4 py-4 font-mono font-medium text-gray-900">{g.groupKey}</td>
                        <td className="px-4 py-4 text-gray-700">{g.subjectName}</td>
                        <td className="px-4 py-4 text-gray-600">{g.professorName}</td>
                        <td className="px-4 py-4 text-gray-600">{g.campus}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                            {g.cycleName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                meta={grpMeta}
                onPage={(p) => { setGrpSelected(new Set()); fetchGroups(p); }}
                label="grupos"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
