"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faUsers,
  faChalkboardTeacher,
  faBook,
  faKey,
  faBuilding,
  faClock,
  faUserTie,
  faChevronLeft,
  faChevronRight,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal, AnimateIn } from "@/frontend/components/students/Modal";

interface RegisterGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectOption { id: number; name: string; subjectKey: string }
interface ProfessorOption { id: number; name: string; registration: string; programName: string; academicLoad: number; statusType: string }
interface StudentOption { id: number; name: string; registration: string; programName: string; cycleName: string; statusType: string }
interface CycleOption { id: number; cycle: string }

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20";
const selectBase =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20";

function IconInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: IconDefinition }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <input {...props} className={inputBase} />
    </div>
  );
}

function IconSelect({ icon, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { icon: IconDefinition }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <select {...props} className={selectBase}>{children}</select>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function MiniPagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" /></button>
      {pages.map((p, i) => p === "..." ? <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400">…</span> : (
        <button key={p} onClick={() => onPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${p === page ? "bg-[#7A154A] text-white" : "text-gray-600 hover:bg-gray-100"}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" /></button>
    </div>
  );
}

export function RegisterGroupModal({ open, onClose, onSuccess }: RegisterGroupModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Options
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [professors, setProfessors] = useState<ProfessorOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [cycles, setCycles] = useState<CycleOption[]>([]);

  // Step 1 form
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [groupKey, setGroupKey] = useState("");
  const [place, setPlace] = useState("");
  const [schedule, setSchedule] = useState("");
  const [professorId, setProfessorId] = useState<number | "">("");
  const [observations, setObservations] = useState("");
  const [cycleId, setCycleId] = useState<number | "">("");

  // Step 2: selected students
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);

  // Step 3: selected professors (visiting)
  const [selectedProfessors, setSelectedProfessors] = useState<Set<number>>(new Set());
  const [profPage, setProfPage] = useState(1);
  const [profTotal, setProfTotal] = useState(0);

  const perPage = 10;

  const fetchSubjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/subjects?limit=200", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setSubjects(json.data.map((s: { id: number; name: string; subjectKey: string }) => ({ id: s.id, name: s.name, subjectKey: s.subjectKey })));
    } catch {}
  }, [token]);

  const fetchCycles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/cycles", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { setCycles(json.data); if (json.data.length > 0 && cycleId === "") setCycleId(json.data[0].id); }
    } catch {}
  }, [token, cycleId]);

  const fetchStudents = useCallback(async (page: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/students?page=${page}&limit=${perPage}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setStudents(json.data.map((s: { id: number; name: string; lastName: string; registration: string; programName: string; cycleName: string; statusType: string }) => ({
          id: s.id, name: `${s.name} ${s.lastName}`, registration: s.registration, programName: s.programName, cycleName: s.cycleName, statusType: s.statusType,
        })));
        setStudentTotal(json.meta.totalPages);
      }
    } catch {}
  }, [token]);

  const fetchProfessors = useCallback(async (page: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/professors?page=${page}&limit=${perPage}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setProfessors(json.data.map((p: { id: number; name: string; lastName: string; employeeNumber: string; programName: string; academicLoad: number; statusType: string }) => ({
          id: p.id, name: `${p.name} ${p.lastName}`, registration: p.employeeNumber, programName: p.programName, academicLoad: p.academicLoad, statusType: p.statusType,
        })));
        setProfTotal(json.meta.totalPages);
      }
    } catch {}
  }, [token]);

  useEffect(() => { if (open) { fetchSubjects(); fetchCycles(); fetchProfessors(1); } }, [open, fetchSubjects, fetchCycles, fetchProfessors]);
  useEffect(() => { if (open && step === 2) fetchStudents(studentPage); }, [open, step, studentPage, fetchStudents]);
  useEffect(() => { if (open && step === 3) fetchProfessors(profPage); }, [open, step, profPage, fetchProfessors]);

  const resetForm = () => {
    setStep(1); setSubjectId(""); setGroupKey(""); setPlace(""); setSchedule(""); setProfessorId(""); setObservations(""); setCycleId("");
    setSelectedStudents(new Set()); setSelectedProfessors(new Set()); setStudentPage(1); setProfPage(1); setLoading(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const toggleStudent = (id: number) => setSelectedStudents(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleProfessor = (id: number) => setSelectedProfessors(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Create the group
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupKey, subjectId, campus: "CICATA MORELOS", place, schedule, professorId, cycleId, observations }),
      });
      const json = await res.json();
      if (!json.success) { setLoading(false); return; }
      const groupId = json.data.id;

      // Add students
      if (selectedStudents.size > 0) {
        await fetch(`/api/groups/${groupId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studentIds: [...selectedStudents] }),
        });
      }

      // Add visiting professors
      if (selectedProfessors.size > 0) {
        await fetch(`/api/groups/${groupId}/professors`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ professors: [...selectedProfessors].map(id => ({ professorId: id, assignedHours: 0 })) }),
        });
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setLoading(false);
    }
  };

  const step1Valid = subjectId !== "" && groupKey.trim() && professorId !== "" && cycleId !== "";

  return (
    <Modal open={open} onClose={handleClose} title="Registrar Grupo" maxWidth="max-w-2xl">
      {/* ── Step 1: Información General ── */}
      {step === 1 && (
        <>
          <AnimateIn delay={0}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FontAwesomeIcon icon={faInfoCircle} className="text-[#7A154A]" />
              Información General
            </div>
          </AnimateIn>

          <AnimateIn delay={50}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Nombre Materia</label>
                <IconSelect icon={faBook} value={subjectId} onChange={e => setSubjectId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Seleccionar...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </IconSelect>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Clave</label>
                <IconInput icon={faKey} placeholder="VI-101" value={groupKey} onChange={e => setGroupKey(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Salón/Sede</label>
                <IconInput icon={faBuilding} placeholder="Salón 104 - Edificio A" value={place} onChange={e => setPlace(e.target.value)} />
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Horario</label>
                <IconInput icon={faClock} placeholder="Lun - Mie, 08:00 - 10:00" value={schedule} onChange={e => setSchedule(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Docente Coordinador</label>
                <IconSelect icon={faUserTie} value={professorId} onChange={e => setProfessorId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Seleccionar...</option>
                  {professors.length === 0 && subjects.length > 0 ? <option disabled>Cargando...</option> : null}
                </IconSelect>
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={150}>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Observaciones</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
                placeholder="Ingrese comentarios adicionales"
                rows={3}
                value={observations}
                onChange={e => setObservations(e.target.value)}
              />
            </div>
          </AnimateIn>

          <AnimateIn delay={200}>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={handleClose} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={() => { if (step1Valid) { fetchStudents(1); setStep(2); } }} disabled={!step1Valid} className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:cursor-not-allowed disabled:opacity-60">
                Siguiente
              </button>
            </div>
          </AnimateIn>
        </>
      )}

      {/* ── Step 2: Gestión de Estudiantes ── */}
      {step === 2 && (
        <>
          <AnimateIn delay={0}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FontAwesomeIcon icon={faUsers} className="text-[#7A154A]" />
              Gestión de Estudiantes
            </div>
          </AnimateIn>

          <AnimateIn delay={50}>
            <div className="mb-3 flex items-center justify-between">
              {selectedStudents.size > 0 ? (
                <span className="rounded-lg bg-[#7A154A] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {selectedStudents.size} seleccionado{selectedStudents.size > 1 ? "s" : ""}
                </span>
              ) : <span />}
              <button className="flex items-center gap-1.5 rounded-lg bg-[#7A154A] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#5e1039]">
                <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                Agregar
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="py-3 pl-4 pr-2 w-8" />
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Estudiante</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Matrícula</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Programa</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Ciclo Académico</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className={`border-b border-gray-50 transition ${selectedStudents.has(s.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"}`}>
                      <td className="py-3 pl-4 pr-2">
                        <input type="checkbox" checked={selectedStudents.has(s.id)} onChange={() => toggleStudent(s.id)} className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7A154A] text-[10px] font-bold text-white">{getInitials(s.name)}</span>
                          <span className="font-medium text-gray-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-600">{s.registration}</td>
                      <td className="px-3 py-3 text-gray-600">{s.programName}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{s.cycleName}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-600">
                          {s.statusType === "INSCRITO" ? "● " : ""}{s.statusType}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay estudiantes disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Mostrando estudiantes</span>
              <MiniPagination page={studentPage} totalPages={studentTotal} onPage={setStudentPage} />
            </div>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Regresar
              </button>
              <button type="button" onClick={() => { fetchProfessors(1); setStep(3); }} className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039]">
                Siguiente
              </button>
            </div>
          </AnimateIn>
        </>
      )}

      {/* ── Step 3: Gestión de Profesores ── */}
      {step === 3 && (
        <>
          <AnimateIn delay={0}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-[#7A154A]" />
              Gestión de Profesores
            </div>
          </AnimateIn>

          <AnimateIn delay={50}>
            <div className="mb-3 flex items-center justify-between">
              {selectedProfessors.size > 0 ? (
                <span className="rounded-lg bg-[#7A154A] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {selectedProfessors.size} seleccionado{selectedProfessors.size > 1 ? "s" : ""}
                </span>
              ) : <span />}
              <button className="flex items-center gap-1.5 rounded-lg bg-[#7A154A] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#5e1039]">
                <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                Agregar
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="py-3 pl-4 pr-2 w-8" />
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Profesor</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Matrícula</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Programa</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Carga Académica</th>
                    <th className="px-3 py-3 font-semibold uppercase tracking-wider text-gray-500">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {professors.map(p => (
                    <tr key={p.id} className={`border-b border-gray-50 transition ${selectedProfessors.has(p.id) ? "bg-rose-50/60" : "hover:bg-gray-50/50"}`}>
                      <td className="py-3 pl-4 pr-2">
                        <input type="checkbox" checked={selectedProfessors.has(p.id)} onChange={() => toggleProfessor(p.id)} className="h-4 w-4 rounded border-gray-300 accent-[#7A154A]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7A154A] text-[10px] font-bold text-white">{getInitials(p.name)}</span>
                          <span className="font-medium text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-600">{p.registration}</td>
                      <td className="px-3 py-3 text-gray-600">{p.programName}</td>
                      <td className="px-3 py-3 text-center font-medium text-gray-700">{p.academicLoad} HRS</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.id === professorId
                            ? "bg-green-50 text-green-600"
                            : "bg-green-50 text-green-600"
                        }`}>
                          ● {p.id === professorId ? "TITULAR" : "VISITANTE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {professors.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay profesores disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Mostrando profesores</span>
              <MiniPagination page={profPage} totalPages={profTotal} onPage={setProfPage} />
            </div>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Regresar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </span>
                ) : "Confirmar"}
              </button>
            </div>
          </AnimateIn>
        </>
      )}
    </Modal>
  );
}
