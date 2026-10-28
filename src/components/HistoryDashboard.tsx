/**
 * StudyFlow Anatomy - History and Performance Dashboard
 * Displays metrics: total attempts, hits, misses, accuracy %,
 * detailed attempt logs with timestamps, and safe history clear.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Trash2,
  Activity,
  Layers,
  Award,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { StudyAttempt } from '../types/anatomy';
import { clearAllAttempts } from '../services/storage';

interface HistoryDashboardProps {
  attempts: StudyAttempt[];
  totalFlashcardsCount: number;
  onHistoryCleared: () => void;
  onGoToStudy: () => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  attempts,
  totalFlashcardsCount,
  onHistoryCleared,
  onGoToStudy,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect'>('all');

  const totalAttempts = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const revealedCount = attempts.filter((a) => a.wasRevealed).length;
  const incorrectCount = attempts.filter((a) => !a.isCorrect && !a.wasRevealed).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  // Unique cards studied count
  const uniqueCardsStudied = new Set(attempts.map((a) => a.flashcardId)).size;

  // Filtered attempts list
  const filteredAttempts = attempts
    .filter((att) => {
      if (filterMode === 'correct') return att.isCorrect;
      if (filterMode === 'incorrect') return !att.isCorrect;
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleConfirmClear = async () => {
    await clearAllAttempts();
    setShowClearConfirm(false);
    onHistoryCleared();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cards Studied */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Cards Praticados</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono tabular-nums">
              {uniqueCardsStudied}
              <span className="text-xs text-slate-500 font-sans font-normal ml-1.5">
                / {totalFlashcardsCount} total
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalFlashcardsCount > 0
                ? `${Math.round((uniqueCardsStudied / totalFlashcardsCount) * 100)}% do acervo revisado`
                : 'Nenhum card cadastrado'}
            </p>
          </div>
        </div>

        {/* Total Attempts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total de Tentativas</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono tabular-nums">
              {totalAttempts}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registros de resposta</p>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Taxa de Acertos</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono tabular-nums">
              {accuracy}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {correctCount} acertos de {totalAttempts}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Desempenho</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div>
              <span className="text-xs text-emerald-400 font-semibold block font-mono">
                {correctCount}
              </span>
              <span className="text-[10px] text-slate-400">Acertos</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-xs text-rose-400 font-semibold block font-mono">
                {incorrectCount}
              </span>
              <span className="text-[10px] text-slate-400">Erros</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-xs text-amber-400 font-semibold block font-mono">
                {revealedCount}
              </span>
              <span className="text-[10px] text-slate-400">Gabaritos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Table Header and Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Histórico Detalhado de Respostas
          </h3>
          <span className="text-xs text-slate-500 font-mono">({filteredAttempts.length})</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('correct')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'correct'
                  ? 'bg-emerald-950/80 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acertos
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('incorrect')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'incorrect'
                  ? 'bg-rose-950/80 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Erros
            </button>
          </div>

          {/* Clear History Button */}
          {totalAttempts > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-medium border border-slate-700/80 hover:border-rose-800 transition-colors flex items-center gap-1.5"
              title="Apagar histórico de tentativas de estudo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Histórico
            </button>
          )}
        </div>
      </div>

      {/* Attempts Log Table */}
      {attempts.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center gap-3">
          <Activity className="w-8 h-8 text-slate-600" />
          <p className="text-sm text-slate-300 font-medium">
            Nenhuma sessão de estudo registrada ainda
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            Inicie o modo de estudo e teste seus conhecimentos anatômicos para registrar seu progresso e taxas de acerto.
          </p>
          <button
            type="button"
            onClick={onGoToStudy}
            className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md"
          >
            Começar a Estudar Agora
          </button>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
          Nenhuma tentativa encontrada com o filtro selecionado.
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Data & Horário</th>
                  <th className="py-3 px-4 font-semibold">Estrutura / Gabarito</th>
                  <th className="py-3 px-4 font-semibold">Sua Resposta</th>
                  <th className="py-3 px-4 font-semibold">Categoria</th>
                  <th className="py-3 px-4 font-semibold text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(attempt.timestamp).toLocaleDateString('pt-BR')}{' '}
                      <span className="text-slate-500">
                        {new Date(attempt.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Question / Correct Answer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">
                        {attempt.correctAnswer}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {attempt.question}
                      </div>
                    </td>

                    {/* User Answer */}
                    <td className="py-3 px-4">
                      {attempt.wasRevealed ? (
                        <span className="text-amber-400 italic flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          Gabarito Revelado
                        </span>
                      ) : (
                        <span
                          className={
                            attempt.isCorrect ? 'text-emerald-300 font-medium' : 'text-rose-300'
                          }
                        >
                          {attempt.userAnswer || '(em branco)'}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {attempt.category || 'Osteologia'}
                    </td>

                    {/* Result Status */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {attempt.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Acerto
                        </span>
                      ) : attempt.wasRevealed ? (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Estudo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Erro
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR HISTORY MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-950/80 border border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Limpar Histórico de Estudos?
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Esta ação apagará todas as {attempts.length} tentativas registradas, zerando as estatísticas e métricas de desempenho.
              </p>
              <p className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-200">
                <strong>Importante:</strong> Seus flashcards e imagens anatômicas cadastradas NÃO serão excluídos. Apenas o histórico de respostas será reiniciado.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
              >
                Sim, Limpar Histórico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
