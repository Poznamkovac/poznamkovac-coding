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
    return {
      resizeObserver: null as ResizeObserver | null,
    };
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

    challengeData() {
      return this.challenge?.challengeData.value ?? null;
    },

    isLoading(): boolean {
      return !this.challenge || this.challenge.isLoading.value;
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
    this.setupHeightMessaging();
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },

  methods: {
    async loadChallenge() {
      await this.challenge?.loadChallenge();
    },

    goToNextChallenge() {
      const nextId = Number(this.challengeId) + 1;
      const nextPath = `/embed/${this.coursePath}/${nextId}`;
      this.$router.push(nextPath);
    },

    setupHeightMessaging() {
      const sendHeight = () => {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
      };

      sendHeight();

      this.resizeObserver = new ResizeObserver(() => {
        sendHeight();
      });
      this.resizeObserver.observe(document.body);

      window.addEventListener('resize', sendHeight);
    },
  },
});
</script>

<template>
  <EmbedLayout>
    <div class="container mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center text-gray-400 py-12">Loading challenge...</div>

      <div v-else-if="challengeData">
        <h2 class="text-3xl font-bold text-white mb-6">
          {{ challengeData.title }}
        </h2>

        <div v-if="challengeData.type !== 'notebook'" class="p-6 mb-6">
          <h3 class="text-xl font-semibold text-white mb-4">
            {{ t("challenge.assignment") }}
          </h3>
          <div class="markdown-content" v-html="challengeData.assignment" />
        </div>

        <QuizChallenge
          v-if="challengeData.type === 'quiz'"
          :challenge-data="challengeData"
          :course-path="coursePath"
          :challenge-id="challengeId"
          :language="language"
          @next-challenge="goToNextChallenge"
        />

        <CodeChallenge
          v-else-if="challengeData.type === 'code'"
          :challenge-data="challengeData"
          :course-path="coursePath"
          :challenge-id="challengeId"
          :language="language"
        />

        <NotebookChallenge
          v-else-if="challengeData.type === 'notebook'"
          :challenge-data="challengeData"
          :course-path="coursePath"
          :challenge-id="challengeId"
          :language="language"
        />
      </div>

      <div v-else class="max-w-2xl mx-auto">
        <div class="p-8 text-center">
          <div class="text-6xl mb-4">😕</div>
          <h2 class="text-2xl font-bold text-white mb-3">
            {{ t("challenge.notFound") }}
          </h2>
          <p class="text-gray-400 mb-6">
            {{ t("challenge.notFoundMessage") }}
          </p>
        </div>
      </div>
    </div>
  </EmbedLayout>
</template>
