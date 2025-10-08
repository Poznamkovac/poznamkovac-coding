<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import QuizAnswer from "../components/QuizAnswer.vue";
import CodeChallenge from "../components/CodeChallenge.vue";
import { validateQuizAnswer } from "../utils/quiz";
import { titleCase } from "../utils";
import { useI18nStore } from "../stores/i18n";
import { storeToRefs } from "pinia";
import { storageService } from "../services/storage";
import type { ChallengeData } from "../types";
import { marked } from "marked";

export default defineComponent({
  name: "ChallengePage",

  components: {
    DefaultLayout,
    QuizAnswer,
    CodeChallenge,
  },

  setup() {
    const { t } = useI18n();
    const i18nStore = useI18nStore();
    const { language } = storeToRefs(i18nStore);

    return {
      t,
      i18nStore,
      language,
    };
  },

  data() {
    return {
      isLoading: true,
      challengeData: null as ChallengeData | null,
      userAnswer: "" as string | string[],
      attemptCount: 0,
      isCorrect: false,
      showCorrectAnswer: false,
      hasCheckedOnce: false,
    };
  },

  computed: {
    pathSegments(): string[] {
      const match = this.$route.params.pathMatch;
      const path = Array.isArray(match) ? match.join("/") : match || "";
      return path.split("/");
    },

    challengeId(): string {
      return this.pathSegments[this.pathSegments.length - 1];
    },

    isQuizChallenge(): boolean {
      return this.challengeData?.type === "quiz";
    },

    isCodeChallenge(): boolean {
      return this.challengeData?.type === "code";
    },

    coursePath(): string {
      return this.pathSegments.slice(0, -1).join("/");
    },

    breadcrumbs(): Array<{ text: string; path: string }> {
      const crumbs: Array<{ text: string; path: string }> = [{ text: this.t("home.courses"), path: "/" }];

      const segments = this.pathSegments;
      let currentPath = "";

      for (let i = 0; i < segments.length - 1; i++) {
        currentPath += `/${segments[i]}`;
        const lang = this.$route.params.lang as string;
        crumbs.push({
          text: titleCase(segments[i]),
          path: lang ? `/${lang}/challenges${currentPath}` : `/challenges${currentPath}`,
        });
      }

      if (this.challengeData) {
        crumbs.push({
          text: this.challengeData.title,
          path: this.$route.path,
        });
      }

      return crumbs;
    },

    nextChallengeId(): number | null {
      return Number(this.challengeId) + 1;
    },

    feedbackMessage(): string {
      if (!this.challengeData || this.challengeData.type !== "quiz") return "";

      if (this.isCorrect && this.challengeData.answer.correctFeedback) {
        return this.challengeData.answer.correctFeedback;
      }

      if (!this.isCorrect && this.hasCheckedOnce && this.challengeData.answer.incorrectFeedback) {
        return this.challengeData.answer.incorrectFeedback;
      }

      return "";
    },
  },

  watch: {
    "$route.params.pathMatch": {
      handler() {
        this.loadChallenge();
      },
    },
  },

  mounted() {
    this.loadChallenge();
  },

  methods: {
    async loadChallenge() {
      this.isLoading = true;
      this.attemptCount = 0;
      this.isCorrect = false;
      this.showCorrectAnswer = false;
      this.hasCheckedOnce = false;
      this.userAnswer = "";

      try {
        const coursePath = this.pathSegments.slice(0, -1).join("/");
        const lang = this.language;
        const metadataPath = `/${lang}/data/${coursePath}/${this.challengeId}/metadata.json`;
        const assignmentMdPath = `/${lang}/data/${coursePath}/${this.challengeId}/assignment.md`;

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
        let title = this.t("challenge.titleNotDefined");
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
        this.challengeData = {
          ...metadata,
          title,
          assignment: assignmentContent,
        } as ChallengeData;
      } catch (error) {
        console.error("Failed to load challenge:", error);
        this.challengeData = null;
      } finally {
        this.isLoading = false;
      }
    },

    async checkAnswer() {
      if (!this.challengeData || this.challengeData.type !== "quiz") return;

      const result = validateQuizAnswer(this.userAnswer, this.challengeData.answer);
      this.isCorrect = result.correct;
      this.attemptCount++;
      this.hasCheckedOnce = true;

      if (this.isCorrect && this.challengeData.maxScore) {
        // Save score to storage
        const lang = this.language === "auto" ? "sk" : this.language;
        await storageService.setChallengeScore(
          this.coursePath,
          this.challengeId,
          this.challengeData.maxScore,
          lang as "sk" | "en",
        );
        console.log(`Score saved: ${this.challengeData.maxScore} points`);
      }
    },

    revealAnswer() {
      this.showCorrectAnswer = true;
    },

    goToNextChallenge() {
      if (!this.nextChallengeId) return;

      const coursePath = this.pathSegments.slice(0, -1).join("/");
      const nextPath = this.i18nStore.getLocalizedPath(`/challenges/${coursePath}/${this.nextChallengeId}`);

      this.$router.push(nextPath);
    },

    navigateTo(path: string) {
      this.$router.push(path);
    },
  },
});
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center text-gray-400 py-12">Loading challenge...</div>

      <div v-else-if="challengeData">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <button
              v-if="index < breadcrumbs.length - 1"
              @click="navigateTo(crumb.path)"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {{ crumb.text }}
            </button>
            <span v-else class="text-gray-400">{{ crumb.text }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="text-gray-600">/</span>
          </template>
        </nav>

        <h2 class="text-3xl font-bold text-white mb-6">{{ challengeData.title }}</h2>

        <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-white mb-4">{{ t("challenge.assignment") }}</h3>
          <div class="markdown-content" v-html="challengeData.assignment"></div>
        </div>

        <!-- Quiz Challenge -->
        <div v-if="isQuizChallenge && challengeData.type === 'quiz'" class="space-y-6">
          <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">Vaša odpoveď</h3>
            <QuizAnswer v-model="userAnswer" :config="challengeData.answer" :disabled="false" />
          </div>

          <!-- Feedback after checking answer -->
          <div
            v-if="hasCheckedOnce && !isCorrect && !showCorrectAnswer"
            class="bg-[#1a1a1a] border border-red-600 rounded-lg p-6"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">✗</span>
              <h3 class="text-xl font-semibold text-red-400">Nesprávne</h3>
            </div>
            <p class="text-gray-300">Skúste to znova. (Pokus {{ attemptCount }}/3)</p>
            <p v-if="feedbackMessage" class="text-gray-300 mt-2">{{ feedbackMessage }}</p>
          </div>

          <!-- Success message -->
          <div v-if="isCorrect" class="bg-[#1a1a1a] border border-green-600 rounded-lg p-6">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">✓</span>
              <h3 class="text-xl font-semibold text-green-400">Správne!</h3>
            </div>
            <p class="text-gray-300">Získali ste {{ challengeData.maxScore }} bodov.</p>
            <p v-if="feedbackMessage" class="text-gray-300 mt-2">{{ feedbackMessage }}</p>
          </div>

          <!-- Revealed answer -->
          <div v-if="showCorrectAnswer && !isCorrect" class="bg-[#1a1a1a] border border-yellow-600 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-yellow-400 mb-3">Správna odpoveď:</h3>
            <div class="text-gray-300">
              <template v-if="challengeData.answer.type === 'radio' || challengeData.answer.type === 'checkbox'">
                <div v-for="option in challengeData.answer.options?.filter((o) => o.correct)" :key="option.id" class="mb-1">
                  • {{ option.text }}
                </div>
              </template>
              <template v-else-if="challengeData.answer.type === 'input'">
                <span class="font-mono bg-gray-800 px-2 py-1 rounded">{{ challengeData.answer.correctAnswer }}</span>
              </template>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-4">
            <button
              @click="checkAnswer"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)"
            >
              Skontrolovať odpoveď
            </button>
            <button
              v-if="attemptCount >= 3 && !isCorrect && !showCorrectAnswer"
              @click="revealAnswer"
              class="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition"
            >
              Zobraziť správnu odpoveď
            </button>
            <button
              v-if="isCorrect || showCorrectAnswer"
              @click="goToNextChallenge"
              class="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              Ďalšia úloha →
            </button>
          </div>
        </div>

        <!-- Code Challenge -->
        <div v-else-if="isCodeChallenge && challengeData.type === 'code'">
          <CodeChallenge
            :challenge-data="challengeData"
            :course-path="coursePath"
            :challenge-id="challengeId"
            :language="language"
          />
        </div>
      </div>

      <div v-else class="max-w-2xl mx-auto">
        <div class="bg-[#1a1a1a] border border-red-900/50 rounded-lg p-8 text-center">
          <div class="text-6xl mb-4">😕</div>
          <h2 class="text-2xl font-bold text-white mb-3">{{ t("challenge.notFound") }}</h2>
          <p class="text-gray-400 mb-6">{{ t("challenge.notFoundMessage") }}</p>
          <button
            @click="$router.push(i18nStore.getLocalizedPath(`/challenges/${coursePath}`))"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>{{ t("challenge.backToCourse") }}</span>
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
