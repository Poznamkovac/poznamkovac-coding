<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent, shallowRef, computed } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import QuizChallenge from "../components/QuizChallenge.vue";
import CodeChallenge from "../components/CodeChallenge.vue";
import NotebookChallenge from "../components/NotebookChallenge.vue";
import { getPathSegments, getChallengeId, getCoursePath } from "../utils/route";
import { getLocalizedPath } from "../i18n";
import { useLanguage } from "../composables/useLanguage";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";
import { useChallenge, type UseChallengeReturn } from "../composables/useChallenge";

export default defineComponent({
  name: "ChallengePage",

  components: {
    DefaultLayout,
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
      embedCopied: false,
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
      const crumbs = useBreadcrumbs(this.$route, this.t("home.courses"), false).value;

      if (this.challengeData) {
        crumbs.push({
          text: this.challengeData.title,
          path: this.$route.path,
        });
      }

      return crumbs;
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
      if (this.challenge) {
        await this.challenge.loadChallenge();
      }
    },

    goToNextChallenge() {
      const nextId = Number(this.challengeId) + 1;
      const nextPath = getLocalizedPath(`/challenges/${this.coursePath}/${nextId}`);
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

        <div v-if="challengeData.type !== 'notebook'" class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-white mb-4">{{ t("challenge.assignment") }}</h3>
          <div class="markdown-content" v-html="challengeData.assignment"></div>
        </div>

        <QuizChallenge
          v-if="isQuizChallenge && challengeData.type === 'quiz'"
          :challenge-data="challengeData"
          :course-path="coursePath"
          :challenge-id="challengeId"
          :language="language"
          @next-challenge="goToNextChallenge"
        />

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
