import { storageService } from "./storageService";
import { LanguageCode } from "../types/i18n";

// Custom event name for score updates
export const SCORE_UPDATE_EVENT = "scoreUpdate";

// Custom event for score updates
export interface ScoreUpdateDetail {
  categoryId: string;
  challengeId: string;
  score: number;
  language?: LanguageCode;
}

// Helper to emit score update events
export const emitScoreUpdate = async (
  categoryId: string,
  challengeId: string,
  score: number,
  language: LanguageCode = "auto",
) => {
  // Save to IndexedDB
  await storageService.setChallengeScore(categoryId, challengeId, score, language);

  // Dispatch custom event with proper type declaration
  window.dispatchEvent(
    new CustomEvent(SCORE_UPDATE_EVENT, {
      detail: { categoryId, challengeId, score, language },
    }),
  );
};
