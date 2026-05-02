"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faUser,
  faIdCard,
  faClock,
  faCalendarDays,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal, AnimateIn } from "@/frontend/components/students/Modal";
import type { ProgramDTO } from "@/shared/types";

interface ProfessorProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  professorId: number;
}

interface ProfessorProfile {
  id: number;
  name: string;
  lastName: string;
  ipnRegistration: string | null;
  employeeNumber: string;
  academicLoad: number;
  availableHours: number;
  programId: number;
  programName: string;
  statusType: string;
  cycleName: string | null;
  groups: string[];
}

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20";

const inputDisabled =
  "w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-500 cursor-not-allowed";

function IconInput({
  icon,
  disabled,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: IconDefinition;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <input {...props} disabled={disabled} className={disabled ? inputDisabled : inputBase} />
    </div>
  );
}

export function ProfessorProfileModal({
  open,
  onClose,
  onSuccess,
  professorId,
}: ProfessorProfileModalProps) {
  const { token } = useAuth();

  return (
    <Modal open={open} onClose={onClose} title="Perfil Profesor">
      {professorId > 0 ? (
        <ProfileContent
          professorId={professorId}
          token={token}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  );
}

function ProfileContent({
  professorId,
  token,
  onClose,
  onSuccess,
}: {
  professorId: number;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<ProfessorProfile>>({});

  const fetchProfile = useCallback(async () => {
    if (!token || !professorId) return;
    setLoading(true);
    try {
      const [profRes, progRes] = await Promise.all([
        fetch(`/api/professors/${professorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/programs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const profJson = await profRes.json();
      const progJson = await progRes.json();
      if (profJson.success) setProfile(profJson.data);
      if (progJson.success) setPrograms(progJson.data);
    } catch (err) {
      console.error("Fetch professor profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, professorId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEdit = () => {
    if (!profile) return;
    setEditData({
      name: profile.name,
      lastName: profile.lastName,
      ipnRegistration: profile.ipnRegistration,
      employeeNumber: profile.employeeNumber,
      academicLoad: profile.academicLoad,
      programId: profile.programId,
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    if (!token || !profile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/professors/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      const json = await res.json();
      if (json.success || res.ok) {
        setEditing(false);
        await fetchProfile();
        onSuccess();
      }
    } catch (err) {
      console.error("Save professor error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-gray-400">Profesor no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <FontAwesomeIcon icon={faGraduationCap} className="text-[#7A154A]" />
          Resumen Académico
        </h3>
        {!editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5e1039]"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            Editar
          </button>
        )}
      </div>

      {/* Row 1: Nombre / Matrícula */}
      <AnimateIn delay={50}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nombre Completo
          </label>
          <IconInput
            icon={faUser}
            type="text"
            disabled={!editing}
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
            disabled={!editing}
            value={editing ? editData.ipnRegistration || "" : profile.ipnRegistration || ""}
            onChange={(e) =>
              setEditData({ ...editData, ipnRegistration: e.target.value })
            }
            placeholder="Ej. MIC-2024-001"
          />
        </div>
      </div>
      </AnimateIn>

      {/* Row 2: Carga Académica / Ciclo Académico */}
      <AnimateIn delay={100}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Carga Académica
          </label>
          <IconInput
            icon={faClock}
            type="text"
            disabled={!editing}
            value={
              editing
                ? String(editData.academicLoad ?? "")
                : `${profile.academicLoad} hrs`
            }
            onChange={(e) =>
              setEditData({ ...editData, academicLoad: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ciclo Académico
          </label>
          <IconInput
            icon={faCalendarDays}
            type="text"
            disabled
            value={profile.cycleName || "—"}
          />
        </div>
      </div>
      </AnimateIn>

      {/* Programa Académico */}
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
            value={editing ? editData.programId || "" : profile.programId}
            onChange={(e) =>
              setEditData({ ...editData, programId: Number(e.target.value) })
            }
            disabled={!editing}
            className={`${!editing ? inputDisabled : inputBase} appearance-none pr-9`}
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

      {/* Grupos Asignados */}
      <AnimateIn delay={200}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Grupos Asignados
        </label>
        {profile.groups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.groups.map((g) => (
              <span
                key={g}
                className="rounded-full border border-[#7A154A]/20 bg-[#7A154A]/5 px-3 py-1 text-xs font-medium text-[#7A154A]"
              >
                {g}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin grupos asignados</p>
        )}
      </div>
      </AnimateIn>

      {/* Footer buttons (edit mode) */}
      {editing && (
        <AnimateIn delay={0}>
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
        </AnimateIn>
      )}
    </div>
  );
}
