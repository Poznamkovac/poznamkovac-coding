import { ref, Ref, ComputedRef } from "vue";
import { marked } from "marked";
import type { ChallengeData, LanguageCode } from "../types";

export interface UseChallengeOptions {
  coursePath: Ref<string> | ComputedRef<string>;
  challengeId: Ref<string> | ComputedRef<string>;
  language: Ref<LanguageCode> | ComputedRef<LanguageCode>;
  fallbackTitle: string;
}

export interface UseChallengeReturn {
  challengeData: Ref<ChallengeData | null>;
  isLoading: Ref<boolean>;
  loadChallenge: () => Promise<void>;
}

export function useChallenge(options: UseChallengeOptions): UseChallengeReturn {
  const { coursePath, challengeId, language, fallbackTitle } = options;

  const challengeData = ref<ChallengeData | null>(null);
  const isLoading = ref(false);

  const loadChallenge = async () => {
    isLoading.value = true;

    try {
      const lang = language.value;
      const metadataPath = `/${lang}/data/${coursePath.value}/${challengeId.value}/metadata.json`;
      const assignmentMdPath = `/${lang}/data/${coursePath.value}/${challengeId.value}/assignment.md`;

      // Load metadata.json
      const metadataResponse = await fetch(metadataPath);
      if (!metadataResponse.ok) {
        throw new Error("Challenge not found");
      }

      // Validate that we got JSON, not HTML (404 page)
      const contentType = metadataResponse.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Challenge not found");
      }

      let metadata;
      try {
        const metadataText = await metadataResponse.text();
        metadata = JSON.parse(metadataText);
      } catch (parseError) {
        throw new Error("Challenge not found");
      }

      // Load assignment.md and parse markdown
      const assignmentMdResponse = await fetch(assignmentMdPath);
      if (!assignmentMdResponse.ok) {
        throw new Error("Assignment content not found");
      }

      const assignmentMarkdown = await assignmentMdResponse.text();
      const lines = assignmentMarkdown.split("\n");

      // Extract title (first h1)
      let title = fallbackTitle;
      let assignmentContent = "";

      if (lines[0]?.startsWith("# ")) {
        title = lines[0].substring(2).trim();
        // Remove the title line and parse the rest as description
        const description = lines.slice(1).join("\n").trim();
        assignmentContent = await marked.parse(description);
      } else {
        assignmentContent = await marked.parse(assignmentMarkdown);
      }

      // Combine metadata with parsed assignment
      challengeData.value = {
        ...metadata,
        title,
        assignment: assignmentContent,
      } as ChallengeData;
    } catch (error) {
      console.error("Failed to load challenge:", error);
      challengeData.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    challengeData,
    isLoading,
    loadChallenge,
  };
}
