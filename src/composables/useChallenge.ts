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

  const extractTitle = (markdown: string): [string, string] => {
    const lines = markdown.split("\n");
    if (lines[0]?.startsWith("# ")) {
      return [lines[0].substring(2).trim(), lines.slice(1).join("\n").trim()];
    }
    return [fallbackTitle, markdown];
  };

  const loadChallenge = async () => {
    isLoading.value = true;

    try {
      const lang = language.value === "auto" ? "sk" : language.value;
      const basePath = `/${lang}/data/${coursePath.value}/${challengeId.value}`;

      const [metadataResponse, assignmentMdResponse] = await Promise.all([
        fetch(`${basePath}/metadata.json`),
        fetch(`${basePath}/assignment.md`),
      ]);

      if (!metadataResponse.ok || !metadataResponse.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Challenge not found");
      }

      if (!assignmentMdResponse.ok) {
        throw new Error("Assignment content not found");
      }

      const [metadata, assignmentMarkdown] = await Promise.all([metadataResponse.json(), assignmentMdResponse.text()]);

      if (metadata.type === "notebook") {
        const { cells, markdownSections } = await parseNotebookMarkdown(assignmentMarkdown);
        const [title] = extractTitle(assignmentMarkdown);

        challengeData.value = {
          type: "notebook",
          title: title || metadata.title,
          maxScore: metadata.maxScore,
          language: metadata.language || "python",
          cells,
          markdownSections,
          imageUrl: metadata.imageUrl,
        };
      } else {
        const [title, content] = extractTitle(assignmentMarkdown);

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
