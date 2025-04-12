import { storageService } from "./storageService";

// Custom event name for score updates
export const SCORE_UPDATE_EVENT = "scoreUpdate";

// Custom event for score updates
export interface ScoreUpdateDetail {
  categoryId: string;
  challengeId: string;
  score: number;
}

// Helper to emit score update events
export const emitScoreUpdate = async (categoryId: string, challengeId: string, score: number) => {
  // Save to IndexedDB
  await storageService.setChallengeScore(categoryId, challengeId, score);

  // Dispatch custom event with proper type declaration
  window.dispatchEvent(
    new CustomEvent(SCORE_UPDATE_EVENT, {
      detail: { categoryId, challengeId, score },
    }),
  );
};
