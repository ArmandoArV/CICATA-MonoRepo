"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileImage,
  faCloudArrowUp,
  faEye,
  faTrashCan,
  faPalette,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@/frontend/components/students/Modal";
import type { LetterheadConfigDTO } from "@/shared/types";

interface Props {
  token: string | null;
}

interface SlotMeta {
  key: "logoHeader" | "topRight" | "footerBottom";
  label: string;
  description: string;
  fileName: string;
}

const SLOTS: SlotMeta[] = [
  { key: "logoHeader", label: "Logo Header", description: "Imagen superior izquierda del membrete (350×65 px recomendado)", fileName: "LogoHeader.png" },
  { key: "topRight", label: "Top Right", description: "Decoración superior derecha (90×90 px recomendado)", fileName: "TopRight.png" },
  { key: "footerBottom", label: "Footer Bottom", description: "Imagen inferior izquierda del membrete (80×80 px recomendado)", fileName: "FooterBottomLeft.png" },
];

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function MembretadoTab({ token }: Props) {
  const [config, setConfig] = useState<LetterheadConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pending uploads (base64 strings) — only committed on "Guardar Cambios"
  const [pending, setPending] = useState<Partial<Record<string, string | null>>>({});
  const [pendingColors, setPendingColors] = useState<{ headerBarColor?: string; accentColor?: string }>({});

  // Preview modal
  const [previewSlot, setPreviewSlot] = useState<string | null>(null);

  // Delete confirmation
  const [deleteSlot, setDeleteSlot] = useState<SlotMeta | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/letterhead", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setConfig(json.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const getSlotImage = (key: string): string | null => {
    if (key in pending) return pending[key] ?? null;
    if (!config) return null;
    return (config as unknown as Record<string, string | null>)[key] ?? null;
  };

  // The CURRENT image is always from config (what's saved in DB/static).
  // Pending uploads only replace it visually after "Guardar Cambios" saves.
  const getCurrentImage = (key: string): string | null => {
    if (!config) return null;
    return (config as unknown as Record<string, string | null>)[key] ?? null;
  };

  const handleFileSelect = (slot: SlotMeta, file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Formato no permitido. Usa PNG, JPG o SVG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("El archivo excede 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setPending((prev) => ({ ...prev, [slot.key]: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (slot: SlotMeta, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(slot, file);
  };

  const confirmDelete = async () => {
    if (!deleteSlot || !token) return;
    setPending((prev) => ({ ...prev, [deleteSlot.key]: null }));
    // Also clear from DB immediately
    try {
      await fetch("/api/letterhead", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot: deleteSlot.key }),
      });
      await fetchConfig();
    } catch { /* noop */ }
    setDeleteSlot(null);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};

      // Only send pending image changes
      for (const [key, val] of Object.entries(pending)) {
        body[key] = val;
      }

      if (pendingColors.headerBarColor) body.headerBarColor = pendingColors.headerBarColor;
      if (pendingColors.accentColor) body.accentColor = pendingColors.accentColor;

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      await fetch("/api/letterhead", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      setPending({});
      setPendingColors({});
      await fetchConfig();
    } catch { /* noop */ }
    finally { setSaving(false); }
  };

  const hasPendingChanges = Object.keys(pending).length > 0 || Object.keys(pendingColors).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A154A]" />
      </div>
    );
  }

  const previewImage = previewSlot ? getCurrentImage(previewSlot) : null;

  return (
    <div className="space-y-8">
      {/* ── Image Slots ── */}
      {SLOTS.map((slot) => {
        const currentImg = getCurrentImage(slot.key);
        const isPending = slot.key in pending;
        const pendingImg = isPending ? pending[slot.key] : null;
        return (
          <section key={slot.key} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <FontAwesomeIcon icon={faFileImage} className="text-[#7A154A]" />
              {slot.label}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* ── LEFT: Upload area ── */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500">Actualizar Imagen</p>

                {/* Pending file indicator */}
                {isPending && pendingImg && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Nueva imagen pendiente de guardar
                  </div>
                )}

                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => handleDrop(slot, e)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-4 py-6 transition hover:border-[#7A154A]/40 hover:bg-rose-50/20"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#7A154A]/10">
                    <FontAwesomeIcon icon={faCloudArrowUp} className="h-4 w-4 text-[#7A154A]" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Arrastra y suelta el archivo aquí</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">o utiliza el botón para buscar</p>

                  <input
                    ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(slot, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    className="mt-3 rounded-lg bg-[#7A154A] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#5e1039] cursor-pointer"
                  >
                    Seleccionar Archivo
                  </button>

                  <p className="mt-2 text-[10px] text-gray-400">{slot.description}</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG, SVG (Máx: 5MB)</p>
                </div>
              </div>

              {/* ── RIGHT: Current image preview ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">Imagen Actual</p>
                  {currentImg && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewSlot(slot.key)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                        title="Vista previa completa"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSlot(slot)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        title="Eliminar"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-4" style={{ minHeight: "180px" }}>
                  {currentImg ? (
                    <img
                      src={`data:image/png;base64,${currentImg}`}
                      alt={slot.label}
                      className="max-h-[160px] max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-gray-400">Sin imagen</p>
                  )}
                </div>

                {currentImg && (
                  <p className="text-center text-[11px] text-gray-400">{slot.fileName}</p>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* ── Color Pickers ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <FontAwesomeIcon icon={faPalette} className="text-[#7A154A]" />
          Colores del Membrete
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-600">Color de línea del pie de página</span>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <input
                type="color"
                value={pendingColors.headerBarColor ?? config?.headerBarColor ?? "#8B1832"}
                onChange={(e) => setPendingColors((c) => ({ ...c, headerBarColor: e.target.value }))}
                className="h-8 w-10 cursor-pointer rounded border-0"
              />
              <span className="text-sm text-gray-700">
                {pendingColors.headerBarColor ?? config?.headerBarColor ?? "#8B1832"}
              </span>
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-gray-600">Color de texto del pie de página</span>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <input
                type="color"
                value={pendingColors.accentColor ?? config?.accentColor ?? "#591020"}
                onChange={(e) => setPendingColors((c) => ({ ...c, accentColor: e.target.value }))}
                className="h-8 w-10 cursor-pointer rounded border-0"
              />
              <span className="text-sm text-gray-700">
                {pendingColors.accentColor ?? config?.accentColor ?? "#591020"}
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* ── Save button ── */}
      <div className="flex justify-end border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasPendingChanges || saving}
          className="rounded-lg border-2 border-[#7A154A] bg-white px-6 py-2.5 text-sm font-semibold text-[#7A154A] shadow-sm transition hover:bg-[#7A154A] hover:text-white disabled:opacity-40 cursor-pointer"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* ── Preview Modal ── */}
      <Modal
        open={!!previewSlot}
        onClose={() => setPreviewSlot(null)}
        title="Vista Previa"
        maxWidth="max-w-lg"
      >
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
          {previewImage ? (
            <img
              src={`data:image/png;base64,${previewImage}`}
              alt="Letterhead preview"
              className="max-h-[340px] max-w-full object-contain"
            />
          ) : (
            <p className="py-12 text-sm text-gray-400">No hay imagen cargada</p>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteSlot}
        onClose={() => setDeleteSlot(null)}
        title=""
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Eliminar Membretado</h3>
          <p className="text-sm text-gray-500">
            ¿Estás segura que quieres eliminar este membretado?
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteSlot(null)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-lg bg-[#7A154A] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e1039] cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
