import type { ChallengeList, ChallengeData } from "../types/challenge";
import { useState, useCallback, useEffect } from "react";

const CHALLENGES_PER_PAGE = 6;

/** Odošle `GET` request a načíta dáta úloh z ID kategórie z určitej strany. */
export const useFetchChallenges = (categoryId: string, currentPage: number) => {
  const [challenges, setChallenges] = useState<ChallengeList>({});
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchChallenge = useCallback(
    async (index: number): Promise<ChallengeData | null> => {
      try {
        const response = await fetch(`/data/ulohy/${categoryId}/${index}/assignment.json`);
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch {
        return null;
      }
    },
    [categoryId]
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
