"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/frontend/components/students/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faDownload } from "@fortawesome/free-solid-svg-icons";

interface Props {
  open: boolean;
  onClose: () => void;
  target: "student" | "professor";
  entityId: number;
  token: string | null;
}

interface TemplateOption {
  id: string;
  key: string;
  name: string;
  description: string;
}

const STUDENT_TEMPLATES: TemplateOption[] = [
  {
    id: "constancia-promedio",
    key: "stu-kardex",
    name: "Generar Kardex de calificaciones",
    description: "Incluye promedio general y estatus académico.",
  },
  {
    id: "constancia-inscripcion",
    key: "stu-constancia",
    name: "Constancia de Estudios",
    description: "Documento de inscripción vigente.",
  },
];

const PROFESSOR_TEMPLATES: TemplateOption[] = [
  {
    id: "carta-aceptacion",
    key: "prof-carta",
    name: "Cartas de aceptación y terminación del servicio social",
    description: "",
  },
  {
    id: "constancia-promedio",
    key: "prof-preactas",
    name: "Pre-actas de unidades de formación",
    description: "",
  },
  {
    id: "constancia-inscripcion",
    key: "prof-inscripcion",
    name: "Constancias de inscripción",
    description: "",
  },
  {
    id: "constancia-reinscripcion",
    key: "prof-reinscripcion",
    name: "Constancias de re-inscripción",
    description: "",
  },
  {
    id: "constancia-promedio",
    key: "prof-carga",
    name: "Carga académica de alumnos",
    description: "",
  },
];

export default function GenerateDocumentModal({ open, onClose, target, entityId, token }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedKey, setSelectedKey] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [generating, setGenerating] = useState(false);
  const [fileName, setFileName] = useState("");
  const [cycles, setCycles] = useState<{ id: number; cycle: string }[]>([]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedKey("");
      setPdfBase64("");
      setGenerating(false);
      setFileName("");
    }
  }, [open]);

  useEffect(() => {
    if (open && token && cycles.length === 0) {
      fetch("/api/cycles", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(j => { if (j.success) setCycles(j.data); })
        .catch(() => {});
    }
  }, [open, token, cycles.length]);

  const templates = target === "student" ? STUDENT_TEMPLATES : PROFESSOR_TEMPLATES;

  const handleGenerate = async () => {
    if (!selectedKey || !token) return;
    const selected = templates.find(t => t.key === selectedKey);
    if (!selected) return;

    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        templateId: selected.id,
        cycleId: cycles[0]?.id ?? 1,
        useAI: false,
      };
      if (target === "student") body.studentId = entityId;
      else body.professorId = entityId;

      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.pdf) {
        setPdfBase64(json.pdf);
        setFileName(json.fileName || "documento.pdf");
        setStep(2);
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBase64) return;
    const byteChars = atob(pdfBase64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="Generar Documento" maxWidth="max-w-lg">
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FontAwesomeIcon icon={faClipboardList} className="text-[#7A154A]" />
            Tipo de Documento
          </div>

          {target === "student" ? (
            /* Card layout for students (2 options) */
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedKey(t.key)}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    selectedKey === t.key
                      ? "border-[#7A154A] bg-rose-50/40"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  {t.description && (
                    <p className="mt-1 text-xs text-gray-500">{t.description}</p>
                  )}
                  {selectedKey === t.key && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A154A] text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Radio list for professors (5 options) */
            <div className="space-y-1">
              {templates.map((t) => (
                <label
                  key={t.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                    selectedKey === t.key
                      ? "border-[#7A154A] bg-rose-50/40"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="prof-doc-type"
                    checked={selectedKey === t.key}
                    onChange={() => setSelectedKey(t.key)}
                    className="h-4 w-4 accent-[#7A154A]"
                  />
                  <span className="text-sm text-gray-800">{t.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedKey || generating}
              className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] disabled:opacity-50"
            >
              {generating ? "Generando..." : "Siguiente"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* PDF Preview */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {pdfBase64 ? (
              <iframe
                src={`data:application/pdf;base64,${pdfBase64}`}
                className="h-[420px] w-full"
                title="Vista previa del documento"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-gray-400">
                Cargando vista previa...
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Regresar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039]"
            >
              <FontAwesomeIcon icon={faDownload} />
              Descargar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
