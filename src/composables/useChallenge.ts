import { ref, Ref, ComputedRef } from "vue";
import { marked } from "marked";
import type { ChallengeData, LanguageCode } from "../types";
import { parseNotebookMarkdown } from "../utils/notebookParser";

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
      const lang = language.value === "auto" ? "sk" : language.value;
      const metadataPath = `/${lang}/data/${coursePath.value}/${challengeId.value}/metadata.json`;
      const assignmentMdPath = `/${lang}/data/${coursePath.value}/${challengeId.value}/assignment.md`;

      const metadataResponse = await fetch(metadataPath);
      if (!metadataResponse.ok || !metadataResponse.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Challenge not found");
      }

      const metadata = await metadataResponse.json();

      const assignmentMdResponse = await fetch(assignmentMdPath);
      if (!assignmentMdResponse.ok) {
        throw new Error("Assignment content not found");
      }

      const assignmentMarkdown = await assignmentMdResponse.text();

      if (metadata.type === "notebook") {
        const { cells, markdownSections } = await parseNotebookMarkdown(assignmentMarkdown);
        const lines = assignmentMarkdown.split("\n");
        const title = lines[0]?.startsWith("# ") ? lines[0].substring(2).trim() : metadata.title || fallbackTitle;

        challengeData.value = {
          type: "notebook",
          title,
          maxScore: metadata.maxScore,
          language: metadata.language || "python",
          cells,
          markdownSections,
          imageUrl: metadata.imageUrl,
        };
      } else {
        const lines = assignmentMarkdown.split("\n");
        const hasTitle = lines[0]?.startsWith("# ");
        const title = hasTitle ? lines[0].substring(2).trim() : fallbackTitle;
        const content = hasTitle ? lines.slice(1).join("\n").trim() : assignmentMarkdown;

        challengeData.value = {
          ...metadata,
          title,
          assignment: await marked.parse(content),
        } as ChallengeData;
      }
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
