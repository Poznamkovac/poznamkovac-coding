<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent, computed, shallowRef } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import QuizAnswer from "../components/QuizAnswer.vue";
import CodeChallenge from "../components/CodeChallenge.vue";
import NotebookChallenge from "../components/NotebookChallenge.vue";
import { validateQuizAnswer } from "../utils/quiz";
import { titleCase } from "../utils";
import { getLocalizedPath } from "../i18n";
import { storageService } from "../services/storage";
import type { LanguageCode } from "../types";
import { useChallenge, type UseChallengeReturn } from "../composables/useChallenge";

export default defineComponent({
  name: "ChallengePage",

  components: {
    DefaultLayout,
    QuizAnswer,
    CodeChallenge,
    NotebookChallenge,
  },

  setup() {
    const { t } = useI18n();

    const language = computed<LanguageCode>({
      get() {
        const stored = localStorage.getItem("language") as LanguageCode | null;
        return stored || "auto";
      },
      set(value: LanguageCode) {
        localStorage.setItem("language", value);
      },
    });

    // Store challenge composable (will be set in mounted)
    // Use shallowRef to prevent Vue from unwrapping the Refs inside
    const challenge = shallowRef<UseChallengeReturn | null>(null);

    return {
      t,
      language,
      challenge,
    };
  },

  data() {
    return {
      userAnswer: "" as string | string[],
      attemptCount: 0,
      isCorrect: false,
      showCorrectAnswer: false,
      hasCheckedOnce: false,
      embedCopied: false,
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

    coursePath(): string {
      return this.pathSegments.slice(0, -1).join("/");
    },

    // Proxy challenge composable properties
    challengeData() {
      if (!this.challenge) return null;
      return this.challenge.challengeData.value;
    },

    isLoading(): boolean {
      if (!this.challenge) return true;
      return this.challenge.isLoading.value;
    },

    isQuizChallenge(): boolean {
      return this.challengeData?.type === "quiz";
    },

    isCodeChallenge(): boolean {
      return this.challengeData?.type === "code";
    },

    isNotebookChallenge(): boolean {
      return this.challengeData?.type === "notebook";
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

    embedIframeCode(): string {
      const lang = this.$route.params.lang as string;
      const coursePath = this.pathSegments.slice(0, -1).join("/");
      const origin = window.location.origin;
      const embedUrl = `${origin}/${lang}/embed/${coursePath}/${this.challengeId}`;
      return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
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
    // Initialize challenge composable with reactive computed properties
    this.challenge = useChallenge({
      coursePath: computed(() => this.coursePath),
      challengeId: computed(() => this.challengeId),
      language: computed(() => this.language),
      fallbackTitle: this.t("challenge.titleNotDefined"),
    });

    this.loadChallenge();
  },

  methods: {
    async loadChallenge() {
      this.attemptCount = 0;
      this.isCorrect = false;
      this.showCorrectAnswer = false;
      this.hasCheckedOnce = false;
      this.userAnswer = "";

      // Use the composable's load function
      if (this.challenge) {
        await this.challenge.loadChallenge();
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
      const nextPath = getLocalizedPath(`/challenges/${coursePath}/${this.nextChallengeId}`);

      this.$router.push(nextPath);
    },

    navigateTo(path: string) {
      this.$router.push(path);
    },

    getLocalizedPath,

    async copyEmbedCode() {
      try {
        await navigator.clipboard.writeText(this.embedIframeCode);
        this.embedCopied = true;
        setTimeout(() => {
          this.embedCopied = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
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

        <div class="flex items-start justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">{{ challengeData.title }}</h2>
          <button
            @click="copyEmbedCode"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2 text-sm"
            :class="{ 'bg-green-600 hover:bg-green-600': embedCopied }"
          >
            <span v-if="embedCopied">✓ Skopírované!</span>
            <span v-else>📋 Kopírovať embed kód</span>
          </button>
        </div>

        <div
          v-if="challengeData.type !== 'notebook'"
          class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6"
        >
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

        <!-- Notebook Challenge -->
        <div v-else-if="isNotebookChallenge && challengeData.type === 'notebook'">
          <NotebookChallenge
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
            @click="$router.push(getLocalizedPath(`/challenges/${coursePath}`))"
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
