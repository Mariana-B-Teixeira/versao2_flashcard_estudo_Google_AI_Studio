/**
 * StudyFlow Anatomy - Answer Validation Service
 * Follows strict medical accuracy criteria:
 * - Case-insensitive
 * - Accent-insensitive (diacritics normalization)
 * - Trims and collapses multiple spaces
 * - Evaluates against primary answer and accepted synonyms
 * - Deterministic, non-AI rule-based validation
 */

import { ValidationResult } from '../types/anatomy';

/**
 * Normalizes anatomical terms for fair and accurate comparison:
 * 1. Lowercases the string
 * 2. Removes accents/diacritics (e.g., trocânter -> trocanter, fêmur -> femur, vértebra -> vertebra)
 * 3. Normalizes spaces and removes peripheral punctuation
 */
export function normalizeAnatomyTerm(term: string): string {
  if (!term) return '';

  return term
    .toLowerCase()
    // Decompose accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace hyphens and slashes with spaces to allow "sulco inter-tubercular" vs "sulco intertubercular"
    .replace(/[-_–—/]/g, ' ')
    // Remove punctuation like quotes, parentheses, brackets, periods, commas
    .replace(/[.,;:!?'"()[\]{}]/g, '')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates a user's answer against the registered correct answer and synonyms
 */
export function validateAnswer(
  userAnswer: string,
  correctAnswer: string,
  synonyms: string[] = []
): ValidationResult {
  const normUser = normalizeAnatomyTerm(userAnswer);
  const normCorrect = normalizeAnatomyTerm(correctAnswer);

  if (!normUser) {
    return {
      isCorrect: false,
      matchedAnswer: null,
      normalizedInput: '',
      normalizedGabarito: normCorrect,
      feedbackMessage: 'Nenhuma resposta foi digitada. Você pode revelar o gabarito ou tentar novamente.',
    };
  }

  // Check against main correct answer
  if (normUser === normCorrect) {
    return {
      isCorrect: true,
      matchedAnswer: correctAnswer,
      normalizedInput: normUser,
      normalizedGabarito: normCorrect,
      feedbackMessage: 'Excelente! Identificação anatômica precisa.',
    };
  }

  // Check against all registered synonyms
  for (const syn of synonyms) {
    const normSyn = normalizeAnatomyTerm(syn);
    if (normSyn && normUser === normSyn) {
      return {
        isCorrect: true,
        matchedAnswer: syn,
        normalizedInput: normUser,
        normalizedGabarito: normCorrect,
        feedbackMessage: `Correto! Sinônimo aceito: "${syn}".`,
      };
    }
  }

  // Incorrect
  return {
    isCorrect: false,
    matchedAnswer: null,
    normalizedInput: normUser,
    normalizedGabarito: normCorrect,
    feedbackMessage: 'Resposta incorreta. Compare a sua resposta com o gabarito oficial cadastrado.',
  };
}
