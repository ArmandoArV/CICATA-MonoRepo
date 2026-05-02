"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdCard, faUserTie } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal, AnimateIn } from "./Modal";

interface ReenrollStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: number;
  studentRegistration?: string;
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

export function ReenrollStudentModal({
  open,
  onClose,
  onSuccess,
  studentId,
  studentRegistration,
}: ReenrollStudentModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const [registration, setRegistration] = useState("");
  const [asesor, setAsesor] = useState("");
  const [director, setDirector] = useState("");

  // Auto-fill registration when a student is selected
  useEffect(() => {
    if (open && studentRegistration) {
      setRegistration(studentRegistration);
    }
  }, [open, studentRegistration]);

  const resetForm = () => {
    setRegistration("");
    setAsesor("");
    setDirector("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!token || !registration) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/students/${studentId}/reenroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registration,
          advisorId: 1,
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
      console.error("Reenroll student error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Reinscripción Estudiante">
      <div className="space-y-4">
        <AnimateIn delay={50}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Matrícula
          </label>
          <IconInput
            icon={faIdCard}
            type="text"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
            placeholder="Ej. MIC-2024-001"
            readOnly={!!studentRegistration}
          />
        </div>
        </AnimateIn>

        <AnimateIn delay={100}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Asesor
          </label>
          <IconInput
            icon={faUserTie}
            type="text"
            value={asesor}
            onChange={(e) => setAsesor(e.target.value)}
            placeholder="Nombre del Asesor"
          />
        </div>
        </AnimateIn>

        <AnimateIn delay={150}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Director Académico
          </label>
          <IconInput
            icon={faUserTie}
            type="text"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            placeholder="Nombre del director encargado"
          />
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
          disabled={loading || !registration}
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
