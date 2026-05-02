"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faHashtag,
  faClock,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal, AnimateIn } from "@/frontend/components/students/Modal";
import type { ProgramDTO } from "@/shared/types";

interface EnrollProfessorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20";

function IconInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: IconDefinition;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <input {...props} className={inputBase} />
    </div>
  );
}

export function EnrollProfessorModal({
  open,
  onClose,
  onSuccess,
}: EnrollProfessorModalProps) {
  const { token } = useAuth();
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [ipnRegistration, setIpnRegistration] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [academicLoad, setAcademicLoad] = useState("");
  const [programId, setProgramId] = useState<number | "">("");

  useEffect(() => {
    if (!open || !token) return;
    fetch("/api/programs", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPrograms(j.data);
      })
      .catch(console.error);
  }, [open, token]);

  const resetForm = () => {
    setFullName("");
    setIpnRegistration("");
    setEmployeeNumber("");
    setAcademicLoad("");
    setProgramId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!token || !fullName || !employeeNumber || !academicLoad || !programId) return;
    setLoading(true);

    const parts = fullName.trim().split(/\s+/);
    const name = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    try {
      const res = await fetch("/api/professors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lastName,
          ipnRegistration: ipnRegistration || null,
          employeeNumber,
          academicLoad: parseFloat(academicLoad),
          programId,
        }),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Enroll professor error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Inscripción Profesor">
      <div className="space-y-3">
        {/* Row 1: Nombre / Matrícula */}
        <AnimateIn delay={50}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <IconInput
              icon={faUser}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez García"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Matrícula
            </label>
            <IconInput
              icon={faIdCard}
              type="text"
              value={ipnRegistration}
              onChange={(e) => setIpnRegistration(e.target.value)}
              placeholder="Ej. MIC-2024-001"
            />
          </div>
        </div>
        </AnimateIn>

        {/* Row 2: Número de Empleado / Carga Académica */}
        <AnimateIn delay={100}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Número de Empleado
            </label>
            <IconInput
              icon={faHashtag}
              type="text"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder="Nombre del coordinador"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Carga Académica
            </label>
            <IconInput
              icon={faClock}
              type="text"
              value={academicLoad}
              onChange={(e) => setAcademicLoad(e.target.value)}
              placeholder="Carga académica permitida"
            />
          </div>
        </div>
        </AnimateIn>

        {/* Row 3: Programa Académico */}
        <AnimateIn delay={150}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Programa Académico
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faGraduationCap} className="h-3.5 w-3.5" />
            </span>
            <select
              value={programId}
              onChange={(e) =>
                setProgramId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
            >
              <option value="">Seleccione un programa</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
        </AnimateIn>
      </div>

      {/* Footer buttons */}
      <AnimateIn delay={200}>
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
          disabled={loading || !fullName || !employeeNumber || !academicLoad || !programId}
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
      </AnimateIn>
    </Modal>
  );
}
