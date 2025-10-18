<script lang="ts">
import { defineComponent, type PropType } from "vue";
import QuizAnswer from "./QuizAnswer.vue";
import { validateQuizAnswer } from "../utils/quiz";
import { storageService } from "../services/storage";
import type { QuizChallengeData, LanguageCode } from "../types";

export default defineComponent({
  name: "QuizChallenge",

  components: {
    QuizAnswer,
  },

  props: {
    challengeData: {
      type: Object as PropType<QuizChallengeData>,
      required: true,
    },
    coursePath: {
      type: String,
      required: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    language: {
      type: String as PropType<LanguageCode>,
      required: true,
    },
  },

  emits: ["next-challenge"],

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
    feedbackMessage(): string {
      if (this.isCorrect) return this.challengeData.answer.correctFeedback || "";
      if (this.hasCheckedOnce) return this.challengeData.answer.incorrectFeedback || "";
      return "";
    },
  },

  methods: {
    async checkAnswer() {
      this.attemptCount++;
      this.hasCheckedOnce = true;

      const { correct } = validateQuizAnswer(this.userAnswer, this.challengeData.answer);

      if (correct) {
        this.isCorrect = true;
        const lang = this.language === "auto" ? "sk" : this.language;
        await storageService.setChallengeScore(this.coursePath, this.challengeId, this.challengeData.maxScore, lang);
      }
    },

    revealAnswer() {
      this.showCorrectAnswer = true;
    },

    goToNextChallenge() {
      this.$emit("next-challenge");
    },
  },
});
</script>

<template>
  <div class="space-y-6">
    <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-white mb-4">Vaša odpoveď</h3>
      <QuizAnswer v-model="userAnswer" :config="challengeData.answer" :disabled="false" />
    </div>

    <div v-if="hasCheckedOnce && !isCorrect && !showCorrectAnswer" class="bg-[#1a1a1a] border border-red-600 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-2xl">✗</span>
        <h3 class="text-xl font-semibold text-red-400">Nesprávne</h3>
      </div>
      <p class="text-gray-300">Skúste to znova. (Pokus {{ attemptCount }}/3)</p>
      <p v-if="feedbackMessage" class="text-gray-300 mt-2">
        {{ feedbackMessage }}
      </p>
    </div>

    <div v-if="isCorrect" class="bg-[#1a1a1a] border border-green-600 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-2xl">✓</span>
        <h3 class="text-xl font-semibold text-green-400">Správne!</h3>
      </div>
      <p class="text-gray-300">Získali ste {{ challengeData.maxScore }} bodov.</p>
      <p v-if="feedbackMessage" class="text-gray-300 mt-2">
        {{ feedbackMessage }}
      </p>
    </div>

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

    <div class="flex gap-4">
      <button
        class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)"
        @click="checkAnswer"
      >
        Skontrolovať odpoveď
      </button>
      <button
        v-if="attemptCount >= 3 && !isCorrect && !showCorrectAnswer"
        class="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition"
        @click="revealAnswer"
      >
        Zobraziť správnu odpoveď
      </button>
      <button
        v-if="isCorrect || showCorrectAnswer"
        class="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
        @click="goToNextChallenge"
      >
        Ďalšia úloha →
      </button>
    </div>
  </div>
</template>
