/**
 * StudyFlow Anatomy - Storage Service
 * Handles persistence using IndexedDB for large image data and flashcards,
 * with localStorage fallback and JSON backup export/import.
 */

import { Flashcard, Collection, StudyAttempt } from '../types/anatomy';

const DB_NAME = 'studyflow_anatomy_db';
const DB_VERSION = 1;
const STORE_FLASHCARDS = 'flashcards';
const STORE_COLLECTIONS = 'collections';
const STORE_ATTEMPTS = 'attempts';

const LS_SETTINGS_KEY = 'studyflow_settings';
const LS_FALLBACK_CARDS = 'studyflow_cards_fallback';
const LS_FALLBACK_COLLECTIONS = 'studyflow_collections_fallback';
const LS_FALLBACK_ATTEMPTS = 'studyflow_attempts_fallback';

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_FLASHCARDS)) {
        const cardStore = db.createObjectStore(STORE_FLASHCARDS, { keyPath: 'id' });
        cardStore.createIndex('collectionId', 'collectionId', { unique: false });
        cardStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
        db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
        const attemptStore = db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'id' });
        attemptStore.createIndex('flashcardId', 'flashcardId', { unique: false });
        attemptStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao abrir IndexedDB'));
  });
}

// Fallback helpers
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn(`Erro ao ler ${key} do localStorage:`, err);
    return defaultValue;
  }
}

function setToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Erro ao salvar ${key} no localStorage:`, err);
  }
}

// Flashcards operations
export async function getAllFlashcards(): Promise<Flashcard[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_FLASHCARDS, 'readonly');
      const store = transaction.objectStore(STORE_FLASHCARDS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Usando fallback do localStorage para flashcards:', err);
    return getFromLocalStorage<Flashcard[]>(LS_FALLBACK_CARDS, []);
  }
}

export async function saveFlashcard(card: Flashcard): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_FLASHCARDS, 'readwrite');
      const store = transaction.objectStore(STORE_FLASHCARDS);
      const request = store.put(card);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Salvando flashcard no fallback:', err);
    const cards = getFromLocalStorage<Flashcard[]>(LS_FALLBACK_CARDS, []);
    const idx = cards.findIndex(c => c.id === card.id);
    if (idx >= 0) {
      cards[idx] = card;
    } else {
      cards.push(card);
    }
    setToLocalStorage(LS_FALLBACK_CARDS, cards);
  }
}

export async function deleteFlashcard(cardId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_FLASHCARDS, 'readwrite');
      const store = transaction.objectStore(STORE_FLASHCARDS);
      const request = store.delete(cardId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Excluindo flashcard do fallback:', err);
    const cards = getFromLocalStorage<Flashcard[]>(LS_FALLBACK_CARDS, []);
    const filtered = cards.filter(c => c.id !== cardId);
    setToLocalStorage(LS_FALLBACK_CARDS, filtered);
  }
}

// Collections operations
export async function getAllCollections(): Promise<Collection[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_COLLECTIONS, 'readonly');
      const store = transaction.objectStore(STORE_COLLECTIONS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Usando fallback do localStorage para coleções:', err);
    return getFromLocalStorage<Collection[]>(LS_FALLBACK_COLLECTIONS, []);
  }
}

export async function saveCollection(collection: Collection): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_COLLECTIONS, 'readwrite');
      const store = transaction.objectStore(STORE_COLLECTIONS);
      const request = store.put(collection);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    const cols = getFromLocalStorage<Collection[]>(LS_FALLBACK_COLLECTIONS, []);
    const idx = cols.findIndex(c => c.id === collection.id);
    if (idx >= 0) {
      cols[idx] = collection;
    } else {
      cols.push(collection);
    }
    setToLocalStorage(LS_FALLBACK_COLLECTIONS, cols);
  }
}

export async function deleteCollection(collectionId: string): Promise<void> {
  // Delete collection and its associated flashcards
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_COLLECTIONS, STORE_FLASHCARDS], 'readwrite');
    const colStore = transaction.objectStore(STORE_COLLECTIONS);
    const cardStore = transaction.objectStore(STORE_FLASHCARDS);

    colStore.delete(collectionId);

    // Get cards to delete
    const cardIndex = cardStore.index('collectionId');
    const cardRequest = cardIndex.getAll(collectionId);

    cardRequest.onsuccess = () => {
      const cards = cardRequest.result || [];
      cards.forEach(card => cardStore.delete(card.id));
    };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    const cols = getFromLocalStorage<Collection[]>(LS_FALLBACK_COLLECTIONS, []);
    setToLocalStorage(LS_FALLBACK_COLLECTIONS, cols.filter(c => c.id !== collectionId));

    const cards = getFromLocalStorage<Flashcard[]>(LS_FALLBACK_CARDS, []);
    setToLocalStorage(LS_FALLBACK_CARDS, cards.filter(c => c.collectionId !== collectionId));
  }
}

// Attempts operations
export async function getAllAttempts(): Promise<StudyAttempt[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readonly');
      const store = transaction.objectStore(STORE_ATTEMPTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return getFromLocalStorage<StudyAttempt[]>(LS_FALLBACK_ATTEMPTS, []);
  }
}

export async function saveAttempt(attempt: StudyAttempt): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_ATTEMPTS);
      const request = store.put(attempt);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    const list = getFromLocalStorage<StudyAttempt[]>(LS_FALLBACK_ATTEMPTS, []);
    list.push(attempt);
    setToLocalStorage(LS_FALLBACK_ATTEMPTS, list);
  }
}

export async function clearAllAttempts(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ATTEMPTS, 'readwrite');
      const store = transaction.objectStore(STORE_ATTEMPTS);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    setToLocalStorage(LS_FALLBACK_ATTEMPTS, []);
  }
}

// Export / Import
export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  collections: Collection[];
  flashcards: Flashcard[];
  attempts: StudyAttempt[];
}

export async function exportDatabaseToJson(): Promise<string> {
  const collections = await getAllCollections();
  const flashcards = await getAllFlashcards();
  const attempts = await getAllAttempts();

  const backup: BackupData = {
    version: 1,
    appName: 'StudyFlow Anatomy',
    exportedAt: new Date().toISOString(),
    collections,
    flashcards,
    attempts,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseFromJson(
  jsonString: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ collectionsCount: number; flashcardsCount: number; attemptsCount: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Arquivo JSON inválido ou corrompido.');
  }

  const data = parsed as Partial<BackupData>;
  if (!Array.isArray(data.flashcards) || !Array.isArray(data.collections)) {
    throw new Error('Estrutura de dados incompatível. O arquivo deve conter coleções e flashcards válidos.');
  }

  const collectionsToSave: Collection[] = data.collections;
  const flashcardsToSave: Flashcard[] = data.flashcards;
  const attemptsToSave: StudyAttempt[] = Array.isArray(data.attempts) ? data.attempts : [];

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_COLLECTIONS, STORE_FLASHCARDS, STORE_ATTEMPTS],
      'readwrite'
    );
    const colStore = transaction.objectStore(STORE_COLLECTIONS);
    const cardStore = transaction.objectStore(STORE_FLASHCARDS);
    const attStore = transaction.objectStore(STORE_ATTEMPTS);

    if (mode === 'replace') {
      colStore.clear();
      cardStore.clear();
      attStore.clear();
    }

    collectionsToSave.forEach(col => colStore.put(col));
    flashcardsToSave.forEach(card => cardStore.put(card));
    attemptsToSave.forEach(att => attStore.put(att));

    transaction.oncomplete = () => {
      resolve({
        collectionsCount: collectionsToSave.length,
        flashcardsCount: flashcardsToSave.length,
        attemptsCount: attemptsToSave.length,
      });
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

// Clean up any old demo cards or demo collections from previous runs
export async function cleanupResidualDemoData(): Promise<void> {
  try {
    const cards = await getAllFlashcards();
    const demoCards = cards.filter(
      (c) => c.collectionId === 'col-demo-osteologia-basica' || c.id.startsWith('card-demo-')
    );
    for (const card of demoCards) {
      await deleteFlashcard(card.id);
    }

    const collections = await getAllCollections();
    const demoCols = collections.filter(
      (col) => col.id === 'col-demo-osteologia-basica' || col.isDemo
    );
    for (const col of demoCols) {
      await deleteCollection(col.id);
    }
  } catch (err) {
    console.warn('Erro ao limpar dados de demonstração residuais:', err);
  }
}

