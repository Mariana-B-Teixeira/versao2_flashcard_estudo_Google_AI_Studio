/**
 * StudyFlow Anatomy - Data Models and Type Definitions
 */

export interface VisualMarker {
  xPercent: number; // 0 to 100% of image width
  yPercent: number; // 0 to 100% of image height
  label?: string;   // Optional anatomical note for the marker
}

export type AnatomyCategory =
  | 'Crânio'
  | 'Coluna Vertebral'
  | 'Membro Superior'
  | 'Membro Inferior'
  | 'Tórax e Pelve'
  | 'Geral';

export interface Flashcard {
  id: string;
  collectionId: string;
  category: string;
  question: string;
  correctAnswer: string;
  synonyms: string[];
  imageDataUrl?: string; // Stored image (base64 data URL)
  imageName?: string;
  marker?: VisualMarker;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  isDemo?: boolean;
}

export interface StudyAttempt {
  id: string;
  flashcardId: string;
  collectionId: string;
  category: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  wasRevealed: boolean;
  timestamp: number;
}

export interface ValidationResult {
  isCorrect: boolean;
  matchedAnswer: string | null;
  normalizedInput: string;
  normalizedGabarito: string;
  feedbackMessage: string;
}

export interface StudyFilterOptions {
  collectionId: string; // 'all' or specific ID
  category: string;     // 'all' or specific category
  shuffle: boolean;
}
