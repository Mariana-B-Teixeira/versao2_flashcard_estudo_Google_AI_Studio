/**
 * StudyFlow Anatomy - Interactive Study Card Component
 * Dedicated active-recall card interface:
 * - Exclusively displays user-uploaded images and user-placed markers
 * - When no image exists, displays an empty area with: "Adicione uma imagem ao seu flashcard" and an upload button
 * - Never uses pre-made or automatically generated images to fill spaces
 * - Evaluates input with accent/case normalization
 * - Instant green/red feedback with anatomical notes
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Upload,
  Crosshair,
  Image as ImageIcon,
} from 'lucide-react';
import { Flashcard, ValidationResult, VisualMarker } from '../types/anatomy';
import { validateAnswer } from '../services/answerValidator';
import { saveFlashcard } from '../services/storage';

interface InteractiveStudyCardProps {
  card: Flashcard;
  currentIndex: number;
  totalCards: number;
  onAnswerSubmit: (userAnswer: string, isCorrect: boolean, wasRevealed: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onCardUpdated?: (updatedCard: Flashcard) => void;
}

export const InteractiveStudyCard: React.FC<InteractiveStudyCardProps> = ({
  card,
  currentIndex,
  totalCards,
  onAnswerSubmit,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
  onCardUpdated,
}) => {
  const [userInput, setUserInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [wasRevealed, setWasRevealed] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Direct image addition inside study mode if card lacks image
  const [isPlacingMarkerInline, setIsPlacingMarkerInline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset local state when moving to another card
  useEffect(() => {
    setUserInput('');
    setHasAnswered(false);
    setWasRevealed(false);
    setValidationResult(null);
    setIsPlacingMarkerInline(false);

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [card.id]);

  // Handle direct file upload for this card
  const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const fileNameLower = file.name.toLowerCase();

    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const hasValidMime = validMimes.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      alert('Formato inválido. Por favor, envie uma imagem nos formatos PNG, JPG ou JPEG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const updatedCard: Flashcard = {
        ...card,
        imageDataUrl: dataUrl,
        imageName: file.name,
        updatedAt: Date.now(),
      };
      await saveFlashcard(updatedCard);
      onCardUpdated?.(updatedCard);
      setIsPlacingMarkerInline(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle positioning a marker on the newly uploaded image directly
  const handleMarkerSet = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingMarkerInline || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0.1, Math.min(99.9, x));
    y = Math.max(0.1, Math.min(99.9, y));

    const newMarker: VisualMarker = {
      xPercent: Number(x.toFixed(2)),
      yPercent: Number(y.toFixed(2)),
    };

    const updatedCard: Flashcard = {
      ...card,
      marker: newMarker,
      updatedAt: Date.now(),
    };
    await saveFlashcard(updatedCard);
    onCardUpdated?.(updatedCard);
  };

  // Submit answer
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (hasAnswered || wasRevealed) return;

    if (!userInput.trim()) {
      return;
    }

    const result = validateAnswer(userInput, card.correctAnswer, card.synonyms);
    setValidationResult(result);
    setHasAnswered(true);
    setWasRevealed(false);
    onAnswerSubmit(userInput, result.isCorrect, false);
  };

  // Reveal answer without typing
  const handleReveal = () => {
    if (hasAnswered || wasRevealed) return;

    setWasRevealed(true);
    setHasAnswered(true);
    const result: ValidationResult = {
      isCorrect: false,
      matchedAnswer: null,
      normalizedInput: '',
      normalizedGabarito: card.correctAnswer,
      feedbackMessage: 'Gabarito revelado para estudo guiado.',
    };
    setValidationResult(result);
    onAnswerSubmit('(Gabarito revelado)', false, true);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!hasAnswered && !wasRevealed && userInput.trim()) {
        handleSubmit();
      } else if (hasAnswered && hasNext) {
        onNext();
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Card Header & Category Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-cyan-400 uppercase tracking-wider">
            {card.category || 'Osteologia'}
          </span>
          <span aria-hidden="true">·</span>
          <span>Active Recall</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 tabular-nums bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
            Card {currentIndex + 1} de {totalCards}
          </span>
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 md:p-7 flex flex-col gap-6"
      >
        {/* Anatomical Question */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Pergunta do Card
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-snug">
            {card.question}
          </h2>
        </div>

        {/* Image Display OR Empty State */}
        {card.imageDataUrl ? (
          <div className="relative w-full flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-hidden min-h-[220px]">
            {isPlacingMarkerInline && (
              <div className="w-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs px-3 py-1.5 rounded-lg mb-2 flex items-center justify-between">
                <span>Clique sobre a estrutura anatômica para posicionar o marcador.</span>
                <button
                  type="button"
                  onClick={() => setIsPlacingMarkerInline(false)}
                  className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-semibold rounded text-[11px]"
                >
                  Concluir
                </button>
              </div>
            )}

            {/* Container matches EXACT rendered image dimensions */}
            <div
              ref={imageContainerRef}
              onClick={handleMarkerSet}
              className={`relative inline-block max-w-full ${
                isPlacingMarkerInline ? 'cursor-crosshair ring-2 ring-cyan-500/50 rounded-lg' : ''
              }`}
            >
              <img
                src={card.imageDataUrl}
                alt={card.imageName || 'Estrutura anatômica enviada pelo usuário'}
                className="max-w-full max-h-[440px] w-auto h-auto object-contain rounded-lg block select-none pointer-events-none"
              />

              {/* Exact Proportional Marker Pin */}
              {card.marker && (
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${card.marker.xPercent}%`,
                    top: `${card.marker.yPercent}%`,
                  }}
                  title={card.marker.label || 'Estrutura anatômica a identificar'}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/25 animate-target-pulse" />
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.9)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white ring-1 ring-cyan-950" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {hasAnswered && card.marker?.label && (
              <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-md px-2.5 py-1 text-[11px] text-cyan-300">
                Nota do Marcador: {card.marker.label}
              </div>
            )}
          </div>
        ) : (
          /* Empty Image Area as strictly requested in requirement 7 */
          <div className="w-full rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/70 p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">
                Adicione uma imagem ao seu flashcard
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Este flashcard foi criado sem uma imagem. Você pode enviar uma foto anatômica do seu dispositivo e posicionar um marcador agora.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Fazer Upload de Imagem
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleDirectImageUpload}
            />
          </div>
        )}

        {/* Answer Input Section */}
        {!hasAnswered ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Digite o nome da estrutura ou acidente ósseo..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-base outline-none transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  Confirmar Resposta
                </button>

                <button
                  type="button"
                  onClick={handleReveal}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="Revelar o gabarito sem preencher o campo"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Revelar Gabarito
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Pressione [Enter] para submeter ou clique em Revelar Gabarito.</span>
              <span>Acentos e maiúsculas são desconsiderados na correção.</span>
            </div>
          </form>
        ) : (
          /* Answer Feedback Card */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Feedback Banner */}
            <div
              className={`rounded-xl p-4 md:p-5 border flex flex-col gap-3 ${
                validationResult?.isCorrect
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : wasRevealed
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {validationResult?.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : wasRevealed ? (
                  <HelpCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-base text-white">
                    {validationResult?.isCorrect
                      ? 'Resposta Correta!'
                      : wasRevealed
                      ? 'Gabarito Oficial Revelado'
                      : 'Resposta Incorreta'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {validationResult?.feedbackMessage}
                  </p>
                </div>
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-700/50 text-sm">
                {!wasRevealed && (
                  <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Sua resposta:</span>
                    <span
                      className={`font-semibold ${
                        validationResult?.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {userInput || '(vazio)'}
                    </span>
                  </div>
                )}

                <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block">Gabarito correto:</span>
                  <span className="font-semibold text-emerald-300">
                    {card.correctAnswer}
                  </span>
                  {card.synonyms.length > 0 && (
                    <div className="text-xs text-slate-400 pt-1">
                      <span className="font-medium text-slate-300">Sinônimos aceitos: </span>
                      {card.synonyms.join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes / Observações Anatômicas */}
              {card.notes && (
                <div className="flex items-start gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 mt-1">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-200">Nota anatômica: </span>
                    {card.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action to Continue */}
            <div className="flex justify-end">
              {hasNext ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  Próximo Card
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  Ver Resumo da Sessão
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Card Anterior
          </button>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Use as setas ou botões para navegar
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext && !hasAnswered}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {hasNext ? 'Próximo Card' : 'Finalizar Sessão'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
