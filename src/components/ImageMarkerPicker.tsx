/**
 * StudyFlow Anatomy - Image Upload and Visual Marker Positioning Component
 * Ensures:
 * 1. Only user-uploaded images (PNG, JPG, JPEG) are used - no auto-generated content.
 * 2. Visual marker (pin/reticle) is placed and adjusted with exact proportional % coordinates.
 * 3. Proportional alignment stays locked through any window or container resize.
 * 4. Resilient handling when no image is present.
 */

import React, { useRef, useState } from 'react';
import { Upload, X, Crosshair, ZoomIn, ZoomOut, RotateCcw, AlertCircle, ImageIcon } from 'lucide-react';
import { VisualMarker } from '../types/anatomy';

interface ImageMarkerPickerProps {
  imageDataUrl?: string;
  imageName?: string;
  marker?: VisualMarker;
  onImageChange: (dataUrl: string | undefined, filename?: string) => void;
  onMarkerChange: (marker: VisualMarker | undefined) => void;
  readOnly?: boolean;
}

export const ImageMarkerPicker: React.FC<ImageMarkerPickerProps> = ({
  imageDataUrl,
  imageName,
  marker,
  onImageChange,
  onMarkerChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Process user file upload (PNG, JPG, JPEG)
  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const fileNameLower = file.name.toLowerCase();

    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const hasValidMime = validMimes.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      setErrorMsg('Formato inválido. Por favor, envie uma imagem nos formatos PNG, JPG ou JPEG.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('A imagem excede 20MB. Recomendamos arquivos de até 10MB para melhor desempenho.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onImageChange(dataUrl, file.name);
      // Keep existing marker or reset if new image
      setZoomLevel(1);
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler a imagem selecionada do seu dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Convert click/pointer coordinates on the rendered image into percentage coordinates (0..100)
  const calculatePercentages = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return null;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Strict clamping
    x = Math.max(0.1, Math.min(99.9, x));
    y = Math.max(0.1, Math.min(99.9, y));

    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !imageDataUrl) return;
    const coords = calculatePercentages(e.clientX, e.clientY);
    if (coords) {
      onMarkerChange({
        xPercent: coords.x,
        yPercent: coords.y,
        label: marker?.label,
      });
    }
  };

  // Dragging support for the pin
  const handleMarkerPointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || readOnly) return;
    const coords = calculatePercentages(e.clientX, e.clientY);
    if (coords) {
      onMarkerChange({
        xPercent: coords.x,
        yPercent: coords.y,
        label: marker?.label,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    if (readOnly) return;
    onImageChange(undefined, undefined);
    onMarkerChange(undefined);
  };

  const handleClearMarker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    onMarkerChange(undefined);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Upload area when no image */}
      {!imageDataUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !readOnly && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
            readOnly
              ? 'border-slate-800 bg-slate-950/60 cursor-default'
              : 'border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              Adicione uma imagem ao seu flashcard
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Selecione uma foto da sua peça anatômica, corte ou radiografia nos formatos PNG, JPG ou JPEG.
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              className="mt-1 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Selecionar Imagem do Dispositivo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={readOnly}
          />
        </div>
      ) : (
        /* Image Display & Marker Reticle Zone */
        <div className="flex flex-col gap-2">
          {/* Controls Bar */}
          {!readOnly && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-medium text-cyan-400 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  {marker ? 'Marcador Posicionado' : 'Clique na imagem para posicionar a mira anatômica'}
                </span>
                {marker && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    (X: {marker.xPercent}% · Y: {marker.yPercent}%)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {marker && (
                  <button
                    type="button"
                    onClick={handleClearMarker}
                    className="px-2.5 py-1 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded transition-colors flex items-center gap-1"
                    title="Remover apenas o marcador visual"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Remover Marcador
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  Substituir Imagem
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors flex items-center gap-1"
                  title="Excluir imagem deste flashcard"
                >
                  <X className="w-3 h-3" />
                  Excluir Imagem
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* Image Canvas with Proportional Alignment Shell */}
          <div
            className="relative w-full flex items-center justify-center bg-slate-950/95 rounded-xl border border-slate-800 p-2 sm:p-4 overflow-hidden select-none min-h-[220px]"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* The wrapper matches the EXACT rendered image dimensions */}
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              className={`relative inline-block max-w-full ${
                !readOnly ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                ref={imageRef}
                src={imageDataUrl}
                alt={imageName || 'Estrutura anatômica enviada pelo usuário'}
                className="max-w-full max-h-[460px] w-auto h-auto block rounded-lg select-none pointer-events-none"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
              />

              {/* Exact Proportional Marker Pin */}
              {marker && (
                <div
                  onPointerDown={handleMarkerPointerDown}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${marker.xPercent}%`,
                    top: `${marker.yPercent}%`,
                    cursor: readOnly ? 'default' : 'grab',
                  }}
                  title={
                    readOnly
                      ? 'Estrutura anatômica a identificar'
                      : 'Clique em outro ponto ou arraste para reposicionar'
                  }
                >
                  <div className="relative flex items-center justify-center">
                    {/* Outer Pulsing Wave */}
                    <div className="absolute w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/25 animate-target-pulse pointer-events-none" />

                    {/* Outer Circle Reticle */}
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-cyan-600/90 shadow-[0_0_12px_rgba(6,182,212,0.85)] flex items-center justify-center transition-transform hover:scale-110">
                      {/* Center Point */}
                      <div className="w-2 h-2 rounded-full bg-white ring-1 ring-cyan-950" />
                    </div>

                    {/* Crosshair ticks */}
                    <div className="absolute -top-1 w-0.5 h-1.5 bg-white/90 pointer-events-none" />
                    <div className="absolute -bottom-1 w-0.5 h-1.5 bg-white/90 pointer-events-none" />
                    <div className="absolute -left-1 h-0.5 w-1.5 bg-white/90 pointer-events-none" />
                    <div className="absolute -right-1 h-0.5 w-1.5 bg-white/90 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Zoom Tool Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 text-slate-300 shadow-md">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 select-none tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="text-[10px] px-1 text-cyan-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {!readOnly && (
            <p className="text-[11px] text-slate-400">
              Dica: Clique exatamente sobre o acidente ósseo que deseja memorizar. O marcador acompanha o osso proporcionalmente caso o tamanho da tela mude.
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
