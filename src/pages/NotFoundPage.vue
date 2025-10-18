<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import { useLanguage } from "../composables/useLanguage";

export default defineComponent({
  name: "NotFoundPage",

  components: {
    DefaultLayout,
  },

  setup() {
    const { t } = useI18n();
    const effectiveLanguage = useLanguage();

    return {
      t,
      effectiveLanguage,
    };
  },

  computed: {
    pathSegments(): string[] {
      const path = this.$route.path.replace(/^\/+|\/+$/g, "");
      return path.split("/").filter(Boolean);
    },

    parentPath(): string {
      if (this.pathSegments.length <= 1) {
        return "/";
      }
      const segments = [...this.pathSegments];
      segments.pop();
      return "/" + segments.join("/");
    },

    isTranslationMissing(): boolean {
      return (
        this.pathSegments.length > 0 &&
        (this.pathSegments[0] === "sk" || this.pathSegments[0] === "en") &&
        this.pathSegments[0] !== this.effectiveLanguage
      );
    },
  },

  methods: {
    goBack() {
      this.$router.push(this.parentPath);
    },

    goHome() {
      this.$router.push("/");
    },
  },
});
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-16 text-center">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-6xl font-bold text-white mb-4">404</h1>

        <div v-if="isTranslationMissing" class="mb-8">
          <p class="text-xl text-gray-300 mb-4">
            {{ t("challenge.notAvailableInLanguage") }}
          </p>
          <p class="text-gray-400">This content is not available in {{ effectiveLanguage.toUpperCase() }}.</p>
        </div>

        <div v-else class="mb-8">
          <p class="text-xl text-gray-300 mb-4">
            {{ t("common.notFound") }}
          </p>
          <p class="text-gray-400">The page you're looking for doesn't exist or has been removed.</p>
        </div>

        <div class="flex gap-4 justify-center">
          <button
            v-if="parentPath !== '/'"
            @click="goBack"
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            {{ t("challenge.goBack", { path: parentPath }) }}
          </button>
          <button @click="goHome" class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
            {{ t("home.courses") }}
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
