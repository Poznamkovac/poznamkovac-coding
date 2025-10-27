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
      scriptCopied: false,
      iframeCopied: false,
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
      return (
        '<iframe src="' +
        embedUrl +
        '" style="width:100%;border:none;background:transparent" allowtransparency="true"></iframe>'
      );
    },

    autoHeightScriptUrl(): string {
      return window.location.origin + "/iframe-resizer.js";
    },

    autoHeightScriptTag(): string {
      return '<script src="' + this.autoHeightScriptUrl + '"></' + "script>";
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
      await this.challenge?.loadChallenge();
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

    async copyScriptCode() {
      try {
        await navigator.clipboard.writeText(this.autoHeightScriptTag);
        this.scriptCopied = true;
        setTimeout(() => {
          this.scriptCopied = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },

    async copyIframeCode() {
      try {
        await navigator.clipboard.writeText(this.embedIframeCode);
        this.iframeCopied = true;
        setTimeout(() => {
          this.iframeCopied = false;
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
              class="text-blue-400 hover:text-blue-300 transition-colors"
              @click="navigateTo(crumb.path)"
            >
              {{ crumb.text }}
            </button>
            <span v-else class="text-gray-400">{{ crumb.text }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="text-gray-600">/</span>
          </template>
        </nav>

        <h2 class="text-3xl font-bold text-white mb-6">
          {{ challengeData.title }}
        </h2>

        <div v-if="challengeData.type !== 'notebook'" class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6">
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

        <!-- Embed instructions -->
        <div class="mt-8 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">
            {{ t("challenge.embedInstructions") }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">{{ t("challenge.autoHeightScript") }}</label>
              <p class="text-sm text-gray-400 mb-2">{{ t("challenge.autoHeightScriptNote") }}</p>
              <div
                class="bg-[#0d0d0d] rounded p-4 text-sm text-gray-300 cursor-pointer hover:bg-[#151515] transition relative group"
                :class="{ 'bg-green-900/30': scriptCopied }"
                @click="copyScriptCode"
              >
                <pre class="break-all whitespace-break-spaces">{{ autoHeightScriptTag }}</pre>
                <span
                  class="absolute top-2 right-2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  :class="scriptCopied ? 'bg-green-600 opacity-100' : 'bg-gray-700'"
                >
                  {{ scriptCopied ? '✓ ' + t("challenge.embedCopied") : t("challenge.clickToCopy") }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-2">{{ t("challenge.embedCode") }}</label>
              <div
                class="bg-[#0d0d0d] rounded p-4 text-sm text-gray-300 cursor-pointer hover:bg-[#151515] transition relative group"
                :class="{ 'bg-green-900/30': iframeCopied }"
                @click="copyIframeCode"
              >
                <pre class="break-all whitespace-break-spaces">{{ embedIframeCode }}</pre>
                <span
                  class="absolute top-2 right-2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  :class="iframeCopied ? 'bg-green-600 opacity-100' : 'bg-gray-700'"
                >
                  {{ iframeCopied ? '✓ ' + t("challenge.embedCopied") : t("challenge.clickToCopy") }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="max-w-2xl mx-auto">
        <div class="bg-[#1a1a1a] border border-red-900/50 rounded-lg p-8 text-center">
          <div class="text-6xl mb-4">😕</div>
          <h2 class="text-2xl font-bold text-white mb-3">
            {{ t("challenge.notFound") }}
          </h2>
          <p class="text-gray-400 mb-6">
            {{ t("challenge.notFoundMessage") }}
          </p>
          <button
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition inline-flex items-center gap-2"
            @click="$router.push(getLocalizedPath(`/challenges/${coursePath}`))"
          >
            <span>←</span>
            <span>{{ t("challenge.backToCourse") }}</span>
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
