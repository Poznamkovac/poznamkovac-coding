import type { QuizAnswerConfig } from "../types";

export function normalizeString(str: string, caseSensitive: boolean, diacriticSensitive: boolean): string {
  let result = str.trim();
  if (!caseSensitive) result = result.toLowerCase();
  if (!diacriticSensitive) result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result;
}

export function validateQuizAnswer(userAnswer: string | string[], config: QuizAnswerConfig): { correct: boolean; score: number } {
  if (config.type === "radio") {
    const selectedOption = config.options?.find((opt) => opt.id === userAnswer);
    const correct = selectedOption?.correct ?? false;
    return { correct, score: correct ? 1 : 0 };
  }

  if (config.type === "checkbox") {
    if (!Array.isArray(userAnswer) || !config.options) {
      return { correct: false, score: 0 };
    }

    const correctOptionIds = new Set(config.options.filter((opt) => opt.correct).map((opt) => opt.id));
    const correct = userAnswer.length === correctOptionIds.size && userAnswer.every((id) => correctOptionIds.has(id));

    return { correct, score: correct ? 1 : 0 };
  }

  if (config.type === "input") {
    if (typeof userAnswer !== "string" || !config.correctAnswer) {
      return { correct: false, score: 0 };
    }

    const caseSensitive = config.caseSensitive ?? true;
    const diacriticSensitive = config.diacriticSensitive ?? true;
    const normalizedUser = normalizeString(userAnswer, caseSensitive, diacriticSensitive);
    const normalizedCorrect = normalizeString(config.correctAnswer, caseSensitive, diacriticSensitive);

    const correct = normalizedUser === normalizedCorrect;
    return { correct, score: correct ? 1 : 0 };
  }

  return { correct: false, score: 0 };
}
