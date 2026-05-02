"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "./Modal";
import type { ProgramDTO } from "@/shared/types";

interface StudentProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: number;
}

interface StudentProfile {
  id: number;
  name: string;
  lastName: string;
  registration: string;
  curp: string;
  programId: number;
  programName: string;
  cycleName: string;
  semester: number;
  statusType: string;
  directorName: string;
  coordinadorName: string;
  promedio: number;
  creditos: number;
}

function ProfileContent({
  studentId,
  onClose,
  onSuccess,
}: {
  studentId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editData, setEditData] = useState<Partial<StudentProfile>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [studentRes, programsRes] = await Promise.all([
        fetch(`/api/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch("/api/programs", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);

      if (studentRes.success || studentRes.data) {
        const data = studentRes.data;
        const p: StudentProfile = {
          id: data.id,
          name: data.name || data.user?.name || "",
          lastName: data.lastName || data.user?.lastName || "",
          registration: data.registration || "",
          curp: data.curp || "",
          programId: data.programId || 0,
          programName: data.programName || "",
          cycleName: data.cycleName || "",
          semester: data.semester || 1,
          statusType: data.statusType || "",
          directorName: data.directorName || "",
          coordinadorName: data.coordinadorName || "",
          promedio: data.promedio ?? 0,
          creditos: data.creditos ?? 0,
        };
        setProfile(p);
        setEditData(p);
      }
      if (programsRes.success) {
        setPrograms(programsRes.data);
      }
    } catch (err) {
      console.error("Load student profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, studentId]);

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadData]);

  const handleSave = async () => {
    if (!token || !editData) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name,
          lastName: editData.lastName,
          registration: editData.registration,
          programId: editData.programId,
        }),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        setEditing(false);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Update student error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(profile ? { ...profile } : {});
    setEditing(false);
  };

  const inputClass = (disabled: boolean) =>
    `w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20 ${
      disabled ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""
    }`;

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-gray-400">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Subheader */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Resumen Académico
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5e1039]"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            Editar
          </button>
        )}
      </div>

      {/* Row 1: Nombre / Matrícula */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nombre Completo
          </label>
          <input
            type="text"
            value={
              editing
                ? `${editData.name || ""} ${editData.lastName || ""}`.trim()
                : `${profile.name} ${profile.lastName}`
            }
            onChange={(e) => {
              const parts = e.target.value.trim().split(/\s+/);
              setEditData({
                ...editData,
                name: parts[0] || "",
                lastName: parts.slice(1).join(" ") || "",
              });
            }}
            disabled={!editing}
            className={inputClass(!editing)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Matrícula
          </label>
          <input
            type="text"
            value={editing ? editData.registration || "" : profile.registration}
            onChange={(e) =>
              setEditData({ ...editData, registration: e.target.value })
            }
            disabled={!editing}
            className={inputClass(!editing)}
          />
        </div>
      </div>

      {/* Row 2: Promedio / Créditos / Ciclo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Promedio
          </label>
          <input
            type="text"
            value={`${profile.promedio}/10`}
            disabled
            className={inputClass(true)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Créditos
          </label>
          <input
            type="text"
            value={String(profile.creditos)}
            disabled
            className={inputClass(true)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ciclo Académico
          </label>
          <input
            type="text"
            value={profile.cycleName}
            disabled
            className={inputClass(true)}
          />
        </div>
      </div>

      {/* Programa Académico */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Programa Académico
        </label>
        <select
          value={editing ? editData.programId || "" : profile.programId}
          onChange={(e) =>
            setEditData({ ...editData, programId: Number(e.target.value) })
          }
          disabled={!editing}
          className={inputClass(!editing)}
        >
          <option value="">Seleccione un programa</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Director Académico */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Director Académico
        </label>
        <input
          type="text"
          value={profile.directorName}
          disabled
          className={inputClass(true)}
        />
      </div>

      {/* Coordinador de Sede */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Coordinador de Sede
        </label>
        <input
          type="text"
          value={profile.coordinadorName}
          disabled
          className={inputClass(true)}
        />
      </div>

      {/* Footer buttons (edit mode) */}
      {editing && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </span>
            ) : (
              "Confirmar"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function StudentProfileModal({
  open,
  onClose,
  onSuccess,
  studentId,
}: StudentProfileModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Perfil Estudiante" maxWidth="max-w-2xl">
      {open && (
        <ProfileContent
          studentId={studentId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}

