"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faKey,
  faStar,
  faInfoCircle,
  faListOl,
  faPen,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Modal, AnimateIn } from "@/frontend/components/students/Modal";

interface EditSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjectId: number;
}

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20";

function IconInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: IconDefinition }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <input {...props} className={inputBase} />
    </div>
  );
}

export function EditSubjectModal({
  open,
  onClose,
  onSuccess,
  subjectId,
}: EditSubjectModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [subjectKey, setSubjectKey] = useState("");
  const [credits, setCredits] = useState("");
  const [semester, setSemester] = useState("1");

  // Step 2 fields
  const [modules, setModules] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newModule, setNewModule] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);

  useEffect(() => {
    if (!open || !token || !subjectId) return;
    const fetchSubject = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/subjects/${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setName(d.name);
          setSubjectKey(d.subjectKey);
          setCredits(String(d.credits));
          setSemester(String(d.semester));
          setModules(Array.isArray(d.topics) ? d.topics : []);
        }
      } catch (err) {
        console.error("Fetch subject error:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSubject();
  }, [open, token, subjectId]);

  const resetForm = () => {
    setStep(1);
    setName("");
    setSubjectKey("");
    setCredits("");
    setSemester("1");
    setModules([]);
    setEditingIndex(null);
    setEditingValue("");
    setNewModule("");
    setShowNewInput(false);
    setLoading(false);
    setFetching(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (!name.trim() || !subjectKey.trim() || !credits.trim()) return;
    setStep(2);
  };

  const handleAddModule = () => {
    if (!newModule.trim()) return;
    setModules((prev) => [...prev, newModule.trim()]);
    setNewModule("");
    setShowNewInput(false);
  };

  const handleDeleteModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const handleEditModule = (index: number) => {
    setEditingIndex(index);
    setEditingValue(modules[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingValue.trim()) return;
    setModules((prev) =>
      prev.map((m, i) => (i === editingIndex ? editingValue.trim() : m))
    );
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          subjectKey: subjectKey.trim(),
          credits: parseFloat(credits),
          semester: parseInt(semester, 10),
          topics: modules,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
        handleClose();
      }
    } catch (err) {
      console.error("Update subject error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Editar Materia" maxWidth="max-w-2xl">
      {fetching ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A154A] border-t-transparent" />
        </div>
      ) : (
        <>
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
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Nombre Materia
                    </label>
                    <IconInput
                      icon={faBook}
                      placeholder="Ej. Virología"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Clave
                    </label>
                    <IconInput
                      icon={faKey}
                      placeholder="VI-101"
                      value={subjectKey}
                      onChange={(e) => setSubjectKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Número de Créditos
                    </label>
                    <IconInput
                      icon={faStar}
                      type="number"
                      placeholder="8"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                    />
                  </div>
                </div>
              </AnimateIn>

              <AnimateIn delay={100}>
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
                    onClick={handleNext}
                    disabled={!name.trim() || !subjectKey.trim() || !credits.trim()}
                    className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Siguiente
                  </button>
                </div>
              </AnimateIn>
            </>
          )}

          {step === 2 && (
            <>
              <AnimateIn delay={0}>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FontAwesomeIcon icon={faListOl} className="text-[#7A154A]" />
                  Temario
                </div>
              </AnimateIn>

              <AnimateIn delay={50}>
                <div className="space-y-2">
                  {modules.map((mod, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all hover:border-gray-300"
                    >
                      <span className="shrink-0 rounded-md bg-[#7A154A] px-2.5 py-1 text-xs font-bold text-white">
                        Módulo {index + 1}
                      </span>
                      {editingIndex === index ? (
                        <input
                          className="flex-1 rounded-md border border-[#7A154A]/30 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") { setEditingIndex(null); setEditingValue(""); } }}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm text-gray-700">{mod}</span>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        {editingIndex === index ? (
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7A154A] transition hover:bg-[#7A154A]/10"
                            title="Guardar"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditModule(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(index)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {showNewInput ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#7A154A]/30 bg-[#7A154A]/5 px-4 py-3">
                      <input
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7A154A] focus:outline-none focus:ring-2 focus:ring-[#7A154A]/20"
                        placeholder="Nombre del módulo"
                        value={newModule}
                        onChange={(e) => setNewModule(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddModule(); if (e.key === "Escape") { setShowNewInput(false); setNewModule(""); } }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddModule}
                        disabled={!newModule.trim()}
                        className="rounded-lg bg-[#7A154A] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#5e1039] disabled:opacity-50"
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowNewInput(false); setNewModule(""); }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewInput(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-500 transition hover:border-[#7A154A]/40 hover:text-[#7A154A]"
                    >
                      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                      Agregar nuevo módulo
                    </button>
                  )}
                </div>
              </AnimateIn>

              <AnimateIn delay={100}>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
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
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </div>
              </AnimateIn>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
