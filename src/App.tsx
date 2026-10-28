/**
 * StudyFlow Anatomy - Main Application
 * Osteology and Anatomical Landmark Flashcards with Active Recall & Visual Reticles
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { StudySession } from './components/StudySession';
import { CardManager } from './components/CardManager';
import { HistoryDashboard } from './components/HistoryDashboard';
import { BackupModal } from './components/BackupModal';
import { Flashcard, Collection, StudyAttempt } from './types/anatomy';
import {
  getAllFlashcards,
  getAllCollections,
  getAllAttempts,
  saveCollection,
  cleanupResidualDemoData,
} from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [attempts, setAttempts] = useState<StudyAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingCardIdFromStudy, setEditingCardIdFromStudy] = useState<string | null>(null);
  const [targetStudyCardId, setTargetStudyCardId] = useState<string | null>(null);

  // Load all data from IndexedDB / Storage without injecting any pre-made cards
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clean up any residual demo cards/demo SVGs from previous runs
      await cleanupResidualDemoData();

      const [loadedCards, loadedCols, loadedAtts] = await Promise.all([
        getAllFlashcards(),
        getAllCollections(),
        getAllAttempts(),
      ]);

      // If no collections exist yet, initialize a clean empty collection for the user
      if (loadedCols.length === 0) {
        const initialCollection: Collection = {
          id: 'col-osteologia-padrao',
          name: 'Minha Coleção de Osteologia',
          description: 'Coleção para armazenar meus flashcards de acidentes ósseos.',
          createdAt: Date.now(),
        };
        await saveCollection(initialCollection);
        setCollections([initialCollection]);
      } else {
        setCollections(loadedCols);
      }

      setFlashcards(loadedCards);
      setAttempts(loadedAtts);

      // If user has cards, default to study tab; if no cards yet, default to cards tab so they can create
      if (loadedCards.length > 0) {
        setActiveTab((current) => current);
      }
    } catch (err) {
      console.error('Falha ao carregar dados do StudyFlow Anatomy:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setOpenCreateModal(false);
        }}
        onOpenNewCardModal={() => {
          setActiveTab('cards');
          setOpenCreateModal(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-mono">
              Carregando acervo anatômico local...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'study' && (
              <StudySession
                cards={flashcards}
                collections={collections}
                onOpenCreateModal={() => {
                  setActiveTab('cards');
                  setOpenCreateModal(true);
                }}
                onRefreshData={loadData}
                targetCardId={targetStudyCardId}
                onTargetCardHandled={() => setTargetStudyCardId(null)}
              />
            )}

            {activeTab === 'cards' && (
              <CardManager
                cards={flashcards}
                collections={collections}
                onDataChange={loadData}
                openCreateModalDirectly={openCreateModal}
                onCloseCreateModalDirectly={() => {
                  setOpenCreateModal(false);
                  setEditingCardIdFromStudy(null);
                }}
                initialEditCardId={editingCardIdFromStudy}
                onStudyCard={(cardId) => {
                  setTargetStudyCardId(cardId);
                  setActiveTab('study');
                }}
              />
            )}

            {activeTab === 'history' && (
              <HistoryDashboard
                attempts={attempts}
                totalFlashcardsCount={flashcards.length}
                onHistoryCleared={loadData}
                onGoToStudy={() => setActiveTab('study')}
              />
            )}

            {activeTab === 'backup' && (
              <BackupModal
                totalCards={flashcards.length}
                totalCollections={collections.length}
                totalAttempts={attempts.length}
                onDataChanged={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">StudyFlow Anatomy</span>
            <span aria-hidden="true">·</span>
            <span>Estudo de Osteologia & Acidentes Ósseos com Active Recall</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Armazenamento local no navegador</span>
            <span aria-hidden="true">·</span>
            <span>Sem dependência externa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
