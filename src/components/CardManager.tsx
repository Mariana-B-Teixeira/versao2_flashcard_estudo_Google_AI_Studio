/**
 * StudyFlow Anatomy - Flashcard & Collection Management
 * Allows creating, editing, previewing, and deleting flashcards and collections.
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  FolderPlus,
  Trash2,
  Edit3,
  Crosshair,
  Image as ImageIcon,
  Folder,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
  FileQuestion,
  Play,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Flashcard, Collection, VisualMarker } from '../types/anatomy';
import { ImageMarkerPicker } from './ImageMarkerPicker';
import {
  saveFlashcard,
  deleteFlashcard,
  saveCollection,
  deleteCollection,
} from '../services/storage';

interface CardManagerProps {
  cards: Flashcard[];
  collections: Collection[];
  onDataChange: () => void;
  openCreateModalDirectly?: boolean;
  onCloseCreateModalDirectly?: () => void;
  initialEditCardId?: string | null;
  onStudyCard?: (cardId: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Crânio',
  'Coluna Vertebral',
  'Membro Superior',
  'Membro Inferior',
  'Tórax e Pelve',
  'Geral',
];

export const CardManager: React.FC<CardManagerProps> = ({
  cards,
  collections,
  onDataChange,
  openCreateModalDirectly,
  onCloseCreateModalDirectly,
  initialEditCardId,
  onStudyCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCol, setSelectedFilterCol] = useState('all');
  const [selectedFilterCat, setSelectedFilterCat] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly || false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form Fields
  const [formQuestion, setFormQuestion] = useState('');
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('');
  const [formSynonymsText, setFormSynonymsText] = useState('');
  const [formCategory, setFormCategory] = useState('Membro Superior');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formCollectionId, setFormCollectionId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImageDataUrl, setFormImageDataUrl] = useState<string | undefined>(undefined);
  const [formImageName, setFormImageName] = useState<string | undefined>(undefined);
  const [formMarker, setFormMarker] = useState<VisualMarker | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // New Collection inline state
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'card' | 'collection';
    id: string;
    name: string;
  } | null>(null);

  // Open modal for new card
  const handleOpenNewCard = () => {
    setEditingCardId(null);
    setFormQuestion('');
    setFormCorrectAnswer('');
    setFormSynonymsText('');
    setFormCategory('Membro Superior');
    setFormCustomCategory('');
    setFormCollectionId(collections[0]?.id || 'col-geral');
    setFormNotes('');
    setFormImageDataUrl(undefined);
    setFormImageName(undefined);
    setFormMarker(undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing card
  const handleEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setFormQuestion(card.question);
    setFormCorrectAnswer(card.correctAnswer);
    setFormSynonymsText(card.synonyms.join(', '));

    if (DEFAULT_CATEGORIES.includes(card.category)) {
      setFormCategory(card.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Outra');
      setFormCustomCategory(card.category);
    }

    setFormCollectionId(card.collectionId);
    setFormNotes(card.notes || '');
    setFormImageDataUrl(card.imageDataUrl);
    setFormImageName(card.imageName);
    setFormMarker(card.marker);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCardId(null);
    onCloseCreateModalDirectly?.();
  };

  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const toggleRevealAnswer = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save Card
  const handleSaveCard = async (e: React.FormEvent, shouldStudyNow = true) => {
    e.preventDefault();
    setFormError(null);

    if (!formQuestion.trim()) {
      setFormError('Por favor, informe a pergunta do flashcard.');
      return;
    }
    if (!formCorrectAnswer.trim()) {
      setFormError('Por favor, informe o nome correto da estrutura anatômica.');
      return;
    }

    let finalCollectionId = formCollectionId;
    if (!finalCollectionId) {
      if (collections.length > 0) {
        finalCollectionId = collections[0].id;
      } else {
        // Create a default collection
        const defaultCol: Collection = {
          id: `col-${Date.now()}`,
          name: 'Minha Coleção de Osteologia',
          createdAt: Date.now(),
        };
        await saveCollection(defaultCol);
        finalCollectionId = defaultCol.id;
      }
    }

    const finalCategory =
      formCategory === 'Outra' ? formCustomCategory.trim() || 'Geral' : formCategory;

    const parsedSynonyms = formSynonymsText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const now = Date.now();
    const cardIdToUse = editingCardId || `card-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const cardToSave: Flashcard = {
      id: cardIdToUse,
      collectionId: finalCollectionId,
      category: finalCategory,
      question: formQuestion.trim(),
      correctAnswer: formCorrectAnswer.trim(),
      synonyms: parsedSynonyms,
      imageDataUrl: formImageDataUrl,
      imageName: formImageName,
      marker: formMarker,
      notes: formNotes.trim() || undefined,
      createdAt: editingCardId ? (cards.find((c) => c.id === editingCardId)?.createdAt || now) : now,
      updatedAt: now,
    };

    await saveFlashcard(cardToSave);
    onDataChange();
    handleCloseModal();

    // If requested, immediately open study mode to answer this card
    if (shouldStudyNow && onStudyCard) {
      onStudyCard(cardToSave.id);
    }
  };

  // Save New Collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim() || undefined,
      createdAt: Date.now(),
    };

    await saveCollection(newCol);
    setNewCollectionName('');
    setNewCollectionDesc('');
    setIsCreatingCollection(false);
    setFormCollectionId(newCol.id);
    onDataChange();
  };

  // Automatically open edit modal if initialEditCardId is passed
  React.useEffect(() => {
    if (initialEditCardId) {
      const cardToEdit = cards.find((c) => c.id === initialEditCardId);
      if (cardToEdit) {
        handleEditCard(cardToEdit);
      }
    }
  }, [initialEditCardId, cards]);

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'card') {
      await deleteFlashcard(deleteTarget.id);
    } else if (deleteTarget.type === 'collection') {
      await deleteCollection(deleteTarget.id);
    }

    setDeleteTarget(null);
    onDataChange();
  };

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchCol =
      selectedFilterCol === 'all' || card.collectionId === selectedFilterCol;
    const matchCat =
      selectedFilterCat === 'all' || card.category === selectedFilterCat;
    const matchSearch =
      searchTerm.trim() === '' ||
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.correctAnswer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.synonyms.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.notes && card.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchCol && matchCat && matchSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Controls: Search, Filter, Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por estrutura, pergunta ou sinônimo..."
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-xs text-slate-200 placeholder:text-slate-500 rounded-lg pl-9 pr-3 py-2 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFilterCol}
            onChange={(e) => setSelectedFilterCol(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">Todas as Coleções</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.isDemo ? '(Exemplo)' : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedFilterCat}
            onChange={(e) => setSelectedFilterCat(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">Todas as Categorias</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreatingCollection(true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            Nova Coleção
          </button>

          <button
            type="button"
            onClick={handleOpenNewCard}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Criar Flashcard
          </button>
        </div>
      </div>

      {/* Cards List or Empty State */}
      {cards.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <FileQuestion className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-200">
              Nenhum flashcard cadastrado ainda
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Crie seus próprios flashcards enviando fotos de ossos ou radiografias do seu dispositivo e posicione marcadores para memorização ativa.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewCard}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Cadastrar Primeiro Flashcard
          </button>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
          Nenhum cartão corresponde aos termos de busca ou filtros selecionados.
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const colName =
              collections.find((c) => c.id === card.collectionId)?.name || 'Geral';

            return (
              <div
                key={card.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all flex flex-col group"
              >
                {/* Thumbnail Preview with Marker */}
                <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
                  {card.imageDataUrl ? (
                    <div className="relative max-h-full max-w-full flex items-center justify-center">
                      <img
                        src={card.imageDataUrl}
                        alt={card.correctAnswer}
                        className="max-h-44 max-w-full object-contain block"
                      />
                      {card.marker && (
                        <div
                          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: `${card.marker.xPercent}%`,
                            top: `${card.marker.yPercent}%`,
                          }}
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-white bg-cyan-500 shadow-md flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-1.5 text-xs p-4 text-center">
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        Adicione uma imagem ao seu flashcard
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditCard(card)}
                        className="mt-1 px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-400 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Fazer Upload de Imagem
                      </button>
                    </div>
                  )}

                  {/* Marker presence indicator */}
                  {card.marker && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-cyan-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                      <Crosshair className="w-3 h-3" />
                      Marcador Ativo
                    </div>
                  )}

                  {/* Category Chip */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                    {card.category}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 block truncate">
                      Coleção: {colName}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-2">
                      {card.question}
                    </h4>
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Gabarito:</span>
                      <button
                        type="button"
                        onClick={() => toggleRevealAnswer(card.id)}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clique para ocultar ou revelar o gabarito"
                      >
                        {revealedAnswers[card.id] ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            {card.correctAnswer}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic flex items-center gap-1 hover:text-slate-300">
                            <Eye className="w-3 h-3" />
                            •••••• (Clique para ver)
                          </span>
                        )}
                      </button>
                    </div>
                    {card.synonyms.length > 0 && revealedAnswers[card.id] && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        Sinônimos: {card.synonyms.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onStudyCard?.(card.id)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Praticar e responder este flashcard agora"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Responder Card
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditCard(card)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Editar flashcard"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'card',
                            id: card.id,
                            name: card.correctAnswer,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                        title="Excluir flashcard"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-30">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-cyan-400" />
                {editingCardId ? 'Editar Flashcard Anatômico' : 'Cadastrar Novo Flashcard'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCard} className="p-6 flex flex-col gap-5">
              {/* Image Upload and Reticle Marker Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>1. Imagem e Marcador Anatômico (Opcional, porém recomendado)</span>
                  {formMarker && (
                    <span className="text-cyan-400 font-normal">
                      Marcador definido em {formMarker.xPercent}% · {formMarker.yPercent}%
                    </span>
                  )}
                </label>
                <ImageMarkerPicker
                  imageDataUrl={formImageDataUrl}
                  imageName={formImageName}
                  marker={formMarker}
                  onImageChange={(dataUrl, name) => {
                    setFormImageDataUrl(dataUrl);
                    setFormImageName(name);
                  }}
                  onMarkerChange={(m) => setFormMarker(m)}
                />
              </div>

              {/* Pergunta */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  2. Pergunta ou Instrução de Identificação *
                </label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Ex: Identifique a eminência óssea indicada pelo marcador no fêmur proximal:"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 outline-none"
                  required
                />
              </div>

              {/* Resposta Correta e Sinônimos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    3. Resposta Correta (Gabarito) *
                  </label>
                  <input
                    type="text"
                    value={formCorrectAnswer}
                    onChange={(e) => setFormCorrectAnswer(e.target.value)}
                    placeholder="Ex: Trocânter maior"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    4. Sinônimos Aceitos (Separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formSynonymsText}
                    onChange={(e) => setFormSynonymsText(e.target.value)}
                    placeholder="Ex: Trocanter maior, Grande trocanter, Greater trochanter"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Categoria e Coleção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    5. Categoria Anatômica
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 rounded-lg px-3.5 py-2.5 outline-none"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Outra">Outra Categoria Personalizada...</option>
                  </select>

                  {formCategory === 'Outra' && (
                    <input
                      type="text"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="Nome da categoria (ex: Artrologia)"
                      className="w-full mt-2 bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-lg px-3.5 py-2 outline-none"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      6. Coleção de Estudo
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCollection(true)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      + Nova Coleção
                    </button>
                  </div>
                  <select
                    value={formCollectionId}
                    onChange={(e) => setFormCollectionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 rounded-lg px-3.5 py-2.5 outline-none"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} {col.isDemo ? '(Exemplo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações / Explicação Complementar */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  7. Observações e Explicação Complementar (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Ponto de inserção muscular do glúteo médio e mínimo; palpável na face lateral da coxa."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 placeholder:text-slate-500 rounded-lg px-3.5 py-2 outline-none resize-none"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveCard(e, false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Apenas Salvar no Acervo
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Salvar e Responder Agora
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW COLLECTION MODAL */}
      {isCreatingCollection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                Criar Nova Coleção
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingCollection(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Nome da Coleção *</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ex: Esqueleto Apendicular Superior"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Descrição (Opcional)</label>
                <input
                  type="text"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="Ex: Clavícula, escápula, úmero, rádio e ulna"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-semibold shadow-md"
                >
                  Salvar Coleção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-950/80 border border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você tem certeza que deseja excluir{' '}
              {deleteTarget.type === 'card' ? 'o flashcard' : 'a coleção'}{' '}
              <strong className="text-rose-300 font-semibold">"{deleteTarget.name}"</strong>?
              {deleteTarget.type === 'collection' &&
                ' Atenção: todos os flashcards pertencentes a esta coleção também serão excluídos.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
              >
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
