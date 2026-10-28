/**
 * StudyFlow Anatomy - Study Session Manager
 * Orchestrates card order, category/collection filtering, shuffling,
 * tracking answers, and rendering completion summary.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Shuffle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Layers,
  Filter,
  Plus,
} from 'lucide-react';
import { Flashcard, Collection, StudyAttempt } from '../types/anatomy';
import { InteractiveStudyCard } from './InteractiveStudyCard';
import { saveAttempt } from '../services/storage';

interface StudySessionProps {
  cards: Flashcard[];
  collections: Collection[];
  onOpenCreateModal: () => void;
  onRefreshData: () => void;
  targetCardId?: string | null;
  onTargetCardHandled?: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  cards,
  collections,
  onOpenCreateModal,
  onRefreshData,
  targetCardId,
  onTargetCardHandled,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Jump directly to targeted card when user wants to respond right after creation or from list
  useEffect(() => {
    if (targetCardId && cards.length > 0) {
      setSelectedCollectionId('all');
      setSelectedCategory('all');
      setIsShuffled(false);
      setIsSessionFinished(false);

      const foundIdx = cards.findIndex((c) => c.id === targetCardId);
      if (foundIdx >= 0) {
        setCurrentIndex(foundIdx);
        // Clear any previous session answer for this specific card so the user can answer fresh
        setSessionAnswers((prev) => prev.filter((a) => a.cardId !== targetCardId));
      }
      onTargetCardHandled?.();
    }
  }, [targetCardId, cards, onTargetCardHandled]);

  // Track answers for current active session
  const [sessionAnswers, setSessionAnswers] = useState<
    Array<{
      cardId: string;
      userAnswer: string;
      isCorrect: boolean;
      wasRevealed: boolean;
    }>
  >([]);

  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Derive unique categories from existing cards
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cards.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats).sort();
  }, [cards]);

  // Filtered card deck
  const activeDeck = useMemo(() => {
    let filtered = cards.filter((card) => {
      const matchCol =
        selectedCollectionId === 'all' || card.collectionId === selectedCollectionId;
      const matchCat =
        selectedCategory === 'all' || card.category === selectedCategory;
      return matchCol && matchCat;
    });

    if (isShuffled) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [cards, selectedCollectionId, selectedCategory, isShuffled]);

  // Current active card
  const currentCard = activeDeck[currentIndex];

  // Answer handler
  const handleAnswerSubmit = async (
    userAnswer: string,
    isCorrect: boolean,
    wasRevealed: boolean
  ) => {
    if (!currentCard) return;

    // Record in current session list
    setSessionAnswers((prev) => [
      ...prev.filter((a) => a.cardId !== currentCard.id),
      {
        cardId: currentCard.id,
        userAnswer,
        isCorrect,
        wasRevealed,
      },
    ]);

    // Save persistent attempt in IndexedDB
    const attempt: StudyAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      flashcardId: currentCard.id,
      collectionId: currentCard.collectionId,
      category: currentCard.category,
      question: currentCard.question,
      userAnswer,
      correctAnswer: currentCard.correctAnswer,
      isCorrect,
      wasRevealed,
      timestamp: Date.now(),
    };

    try {
      await saveAttempt(attempt);
    } catch (err) {
      console.warn('Erro ao salvar tentativa de estudo:', err);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsSessionFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionAnswers([]);
    setIsSessionFinished(false);
  };

  // Metrics for current session
  const correctCount = sessionAnswers.filter((a) => a.isCorrect).length;
  const revealedCount = sessionAnswers.filter((a) => a.wasRevealed).length;
  const incorrectCount = sessionAnswers.filter((a) => !a.isCorrect && !a.wasRevealed).length;
  const answeredTotal = sessionAnswers.length;
  const accuracyPercent = answeredTotal > 0 ? Math.round((correctCount / answeredTotal) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Session Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Collection Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setCurrentIndex(0);
                setIsSessionFinished(false);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400"
            >
              <option value="all">Todas as Coleções ({cards.length} cards)</option>
              {collections.map((col) => {
                const count = cards.filter((c) => c.collectionId === col.id).length;
                return (
                  <option key={col.id} value={col.id}>
                    {col.name} {col.isDemo ? '(Exemplo)' : ''} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentIndex(0);
                setIsSessionFinished(false);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400"
            >
              <option value="all">Todas as Categorias</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shuffle and Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsShuffled((prev) => !prev);
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isShuffled
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Embaralhar ordem dos cartões"
          >
            <Shuffle className="w-3.5 h-3.5" />
            {isShuffled ? 'Ordem Embaralhada' : 'Embaralhar'}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="Reiniciar sessão do primeiro cartão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeDeck.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-200">
              Nenhum flashcard encontrado
            </h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Não existem cartões cadastrados para os filtros selecionados. Crie um novo cartão com suas imagens anatômicas.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Flashcard
          </button>
        </div>
      ) : isSessionFinished ? (
        /* Session Completed Summary View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl flex flex-col gap-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">
              Sessão de Estudo Concluída!
            </h2>
            <p className="text-xs text-slate-400">
              Você revisou {activeDeck.length} estruturas anatômicas nesta sessão.
            </p>
          </div>

          {/* Scorecards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-medium">Aproveitamento</span>
              <span className="text-3xl font-bold text-cyan-400 font-mono tabular-nums mt-1">
                {accuracyPercent}%
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-950/50 flex flex-col items-center">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Acertos
              </span>
              <span className="text-3xl font-bold text-emerald-300 font-mono tabular-nums mt-1">
                {correctCount}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-rose-950/50 flex flex-col items-center">
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Erros / Revelados
              </span>
              <span className="text-3xl font-bold text-rose-300 font-mono tabular-nums mt-1">
                {incorrectCount + revealedCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Esta Coleção
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedCollectionId('all');
                handleRestart();
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Estudar Todas as Estruturas
            </button>
          </div>
        </div>
      ) : (
        /* Active Study Card */
        <InteractiveStudyCard
          key={currentCard.id}
          card={currentCard}
          currentIndex={currentIndex}
          totalCards={activeDeck.length}
          onAnswerSubmit={handleAnswerSubmit}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < activeDeck.length - 1}
          onCardUpdated={() => onRefreshData()}
        />
      )}
    </div>
  );
};
