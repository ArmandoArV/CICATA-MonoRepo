"use client";

import { useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "./Modal";

interface DeleteStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: number;
}

export function DeleteStudentModal({
  open,
  onClose,
  onSuccess,
  studentId,
}: DeleteStudentModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (json.success || res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Delete student error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Eliminar Estudiante" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {/* Warning icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-2xl text-amber-500"
          />
        </div>

        <p className="text-sm text-gray-600">
          ¿Estás segura que quieres dar de baja este estudiante?
        </p>
      </div>

      {/* Footer buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
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
          ) : (
            "Confirmar"
          )}
        </button>
      </div>
    </Modal>
  );
}
