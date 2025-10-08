<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent, computed, shallowRef } from "vue";
import EmbedLayout from "../layouts/EmbedLayout.vue";
import QuizAnswer from "../components/QuizAnswer.vue";
import CodeChallenge from "../components/CodeChallenge.vue";
import { validateQuizAnswer } from "../utils/quiz";
import { storageService } from "../services/storage";
import type { LanguageCode } from "../types";
import { useChallenge, type UseChallengeReturn } from "../composables/useChallenge";

export default defineComponent({
  name: "EmbedChallengePage",

  components: {
    EmbedLayout,
    QuizAnswer,
    CodeChallenge,
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
      const nextPath = `/embed/${coursePath}/${this.nextChallengeId}`;

      this.$router.push(nextPath);
    },
  },
});
</script>

<template>
  <EmbedLayout>
    <div class="container mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center text-gray-400 py-12">Loading challenge...</div>

      <div v-else-if="challengeData">
        <h2 class="text-3xl font-bold text-white mb-6">{{ challengeData.title }}</h2>

        <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-white mb-4">{{ t("challenge.assignment") }}</h3>
          <div class="markdown-content" v-html="challengeData.assignment"></div>
        </div>

        <!-- Quiz Challenge -->
        <div v-if="challengeData.type === 'quiz'" class="space-y-6">
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
          </div>
        </div>

        <!-- Code Challenge -->
        <div v-else-if="challengeData.type === 'code'">
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
        </div>
      </div>
    </div>
  </EmbedLayout>
</template>
