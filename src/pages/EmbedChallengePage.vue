<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent, shallowRef, computed } from "vue";
import EmbedLayout from "../layouts/EmbedLayout.vue";
import QuizChallenge from "../components/QuizChallenge.vue";
import CodeChallenge from "../components/CodeChallenge.vue";
import NotebookChallenge from "../components/NotebookChallenge.vue";
import { getPathSegments, getChallengeId, getCoursePath } from "../utils/route";
import { useLanguage } from "../composables/useLanguage";
import { useChallenge, type UseChallengeReturn } from "../composables/useChallenge";

export default defineComponent({
  name: "EmbedChallengePage",

  components: {
    EmbedLayout,
    QuizChallenge,
    CodeChallenge,
    NotebookChallenge,
  },

  setup() {
    const { t } = useI18n();
    const language = useLanguage();
    const challenge = shallowRef<UseChallengeReturn | null>(null);

    return {
      t,
      language,
      challenge,
    };
  },

  data() {
    return {};
  },

  computed: {
    pathSegments(): string[] {
      return getPathSegments(this.$route);
    },

    challengeId(): string {
      return getChallengeId(this.$route);
    },

    coursePath(): string {
      return getCoursePath(this.$route);
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
      if (this.challenge) {
        await this.challenge.loadChallenge();
      }
    },

    goToNextChallenge() {
      const nextId = Number(this.challengeId) + 1;
      const nextPath = `/embed/${this.coursePath}/${nextId}`;
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

        <div
          v-if="challengeData.type !== 'notebook'"
          class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6"
        >
          <h3 class="text-xl font-semibold text-white mb-4">{{ t("challenge.assignment") }}</h3>
          <div class="markdown-content" v-html="challengeData.assignment"></div>
        </div>

        <QuizChallenge
          v-if="challengeData.type === 'quiz'"
          :challenge-data="challengeData"
          :course-path="coursePath"
          :challenge-id="challengeId"
          :language="language"
          @next-challenge="goToNextChallenge"
        />

        <!-- Code Challenge -->
        <div v-else-if="challengeData.type === 'code'">
          <CodeChallenge
            :challenge-data="challengeData"
            :course-path="coursePath"
            :challenge-id="challengeId"
            :language="language"
          />
        </div>

        <!-- Notebook Challenge -->
        <div v-else-if="challengeData.type === 'notebook'">
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
        </div>
      </div>
    </div>
  </EmbedLayout>
</template>
