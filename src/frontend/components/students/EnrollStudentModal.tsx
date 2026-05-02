"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { Modal } from "./Modal";
import type { ProgramDTO } from "@/shared/types";

interface EnrollStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnrollStudentModal({
  open,
  onClose,
  onSuccess,
}: EnrollStudentModalProps) {
  const { token } = useAuth();
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [registration, setRegistration] = useState("");
  const [curp, setCurp] = useState("");
  const [cycle, setCycle] = useState("");
  const [coordinador, setCoordinador] = useState("");
  const [director, setDirector] = useState("");
  const [programId, setProgramId] = useState<number | "">("");

  useEffect(() => {
    if (!open || !token) return;
    fetch("/api/programs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPrograms(json.data);
      })
      .catch(console.error);
  }, [open, token]);

  const resetForm = () => {
    setFullName("");
    setRegistration("");
    setCurp("");
    setCycle("");
    setCoordinador("");
    setDirector("");
    setProgramId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!token || !fullName || !registration || !curp || !programId) return;
    setLoading(true);

    const parts = fullName.trim().split(/\s+/);
    const name = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lastName,
          curp,
          registration,
          cycleId: 1,
          programId: Number(programId),
          coordinadorId: 1,
          directorId: 1,
        }),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Enroll student error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Inscripción Estudiante" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Row 1: Nombre / Matrícula */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez Garcia"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Matrícula
            </label>
            <input
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              placeholder="Ej. MIC-2024-001"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
        </div>

        {/* Row 2: CURP / Ciclo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              CURP
            </label>
            <input
              type="text"
              value={curp}
              onChange={(e) => setCurp(e.target.value)}
              placeholder="Ej. GABA041024HDFRRL09"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ciclo Académico
            </label>
            <input
              type="text"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              placeholder="Ej. 2025-2026/1"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
        </div>

        {/* Row 3: Coordinador / Director */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Coordinador de Sede
            </label>
            <input
              type="text"
              value={coordinador}
              onChange={(e) => setCoordinador(e.target.value)}
              placeholder="Nombre del coordinador"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Director Académico
            </label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="Nombre del director"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            />
          </div>
        </div>

        {/* Row 4: Programa Académico */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Programa Académico
          </label>
          <select
            value={programId}
            onChange={(e) =>
              setProgramId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
          >
            <option value="">Seleccione un programa</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !fullName || !registration || !curp || !programId}
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
          ) : (
            "Confirmar"
          )}
        </button>
      </div>
    </Modal>
  );
}
