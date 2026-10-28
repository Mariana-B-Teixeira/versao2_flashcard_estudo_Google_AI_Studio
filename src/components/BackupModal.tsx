/**
 * StudyFlow Anatomy - Backup and Data Persistence Manager
 * Provides:
 * - JSON export of all collections, flashcards, and history
 * - JSON import with validation and merge/replace options
 * - Storage transparency notice regarding local persistence vs cross-device sync
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
} from '../services/storage';

interface BackupModalProps {
  totalCards: number;
  totalCollections: number;
  totalAttempts: number;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  totalCards,
  totalCollections,
  totalAttempts,
  onDataChanged,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger JSON download
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setStatusMsg(null);
      const json = await exportDatabaseToJson();

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyflow-anatomy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: 'Backup exportado com sucesso! Arquivo JSON baixado para seu dispositivo.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Erro ao gerar o arquivo de backup: ' + (err as Error).message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle JSON file upload
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await importDatabaseFromJson(text, importMode);
        onDataChanged();
        setStatusMsg({
          type: 'success',
          text: `Backup importado com êxito! ${result.flashcardsCount} flashcards e ${result.collectionsCount} coleções restauradas.`,
        });
      } catch (err) {
        setStatusMsg({
          type: 'error',
          text: 'Falha na importação: ' + (err as Error).message,
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setIsImporting(false);
      setStatusMsg({
        type: 'error',
        text: 'Erro ao ler o arquivo selecionado.',
      });
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Important Storage Transparency Notice */}
      <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-xl p-4 md:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">
            Privacidade e Armazenamento Local
          </h4>
          <p>
            Todos os seus flashcards, fotos anatômicas de osteologia e marcações são armazenados localmente no seu navegador utilizando a tecnologia <strong className="text-cyan-300">IndexedDB</strong>.
          </p>
          <p className="text-slate-400">
            <strong>Atenção:</strong> Os dados locais não são sincronizados automaticamente na nuvem entre navegadores ou celulares diferentes. Para salvar uma cópia de segurança ou transferir seus cards para outro dispositivo, utilize o botão de exportar abaixo.
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/50 border-rose-800 text-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Database Statistics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Volume de Dados no Armazenamento Local</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Flashcards Cadastrados</span>
            <span className="text-xl font-bold text-white font-mono">{totalCards}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Coleções de Estudo</span>
            <span className="text-xl font-bold text-white font-mono">{totalCollections}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Tentativas Registradas</span>
            <span className="text-xl font-bold text-white font-mono">{totalAttempts}</span>
          </div>
        </div>
      </div>

      {/* Export & Import Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar Backup Completo</span>
            </div>
            <p className="text-xs text-slate-400">
              Gera um arquivo JSON estruturado contendo todas as suas coleções, flashcards, imagens anatômicas codificadas e histórico de tentativas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exportando dados...' : 'Baixar Arquivo JSON de Backup'}
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Restaurar / Importar Backup</span>
            </div>
            <p className="text-xs text-slate-400">
              Carregue um arquivo JSON gerado anteriormente pelo StudyFlow Anatomy para restaurar em outro dispositivo.
            </p>
          </div>

          {/* Import Mode Radio */}
          <div className="flex items-center gap-4 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-cyan-400"
              />
              <span>Mesclar com existentes</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-cyan-400"
              />
              <span>Substituir tudo</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            {isImporting ? 'Processando arquivo...' : 'Selecionar Arquivo JSON para Importar'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

    </div>
  );
};
