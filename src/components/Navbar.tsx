/**
 * StudyFlow Anatomy - Top Navigation Bar
 * Follows the 3-zone Top Bar Contract:
 * [Brand Wordmark] --- [Nav Links] --- [Primary Action]
 */

import React from 'react';
import { Plus, BookOpen, Layers, BarChart3, HardDrive } from 'lucide-react';

export type ActiveTab = 'study' | 'cards' | 'history' | 'backup';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewCardModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewCardModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onTabChange('study')}
          className="cursor-pointer flex items-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors">
            StudyFlow Anatomy
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTabChange('study')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'study'
                ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Estudar</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('cards')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progresso</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('backup')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backup & Dados</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenNewCardModal}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Novo Flashcard</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
