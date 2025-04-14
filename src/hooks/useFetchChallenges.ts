import type { ChallengeList, ChallengeData } from "../types/challenge";
import { useState, useCallback, useEffect } from "react";
import { useI18n } from "./useI18n";
import { getLocalizedResourceUrl } from "../services/i18nService";

const CHALLENGES_PER_PAGE = 6;

/** Odošle `GET` request a načíta dáta úloh z ID kategórie z určitej strany. */
export const useFetchChallenges = (categoryPath: string, currentPage: number) => {
  const [challenges, setChallenges] = useState<ChallengeList>({});
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { language } = useI18n();

  const fetchChallenge = useCallback(
    async (index: number): Promise<ChallengeData | null> => {
      try {
        // Convert any / in categoryPath to normal path structure
        const normalizedPath = categoryPath.replace(/\//g, "/");

        // Build the challenge URL with the full path
        const url = getLocalizedResourceUrl(`/data/challenges/${normalizedPath}/${index}/assignment.json`, language);
        const response = await fetch(url);
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch {
        return null;
      }
    },
    [categoryPath, language],
  );

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    const startIndex = (currentPage - 1) * CHALLENGES_PER_PAGE + 1;
    const endIndex = startIndex + CHALLENGES_PER_PAGE - 1;

    const newChallenges: ChallengeList = {};
    let reachedEnd = false;

    for (let i = startIndex; i <= endIndex; i++) {
      const challenge = await fetchChallenge(i);
      if (challenge === null) {
        reachedEnd = true;
        break;
      }
      newChallenges[i] = challenge;
    }

    setChallenges(newChallenges);
    setIsLastPage(reachedEnd || Object.keys(newChallenges).length < CHALLENGES_PER_PAGE);
    setIsLoading(false);
  }, [currentPage, fetchChallenge]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return { challenges, isLastPage, isLoading };
};
