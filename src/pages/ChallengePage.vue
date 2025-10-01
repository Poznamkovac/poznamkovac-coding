<script lang="ts">
import { defineComponent } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import type { ChallengeData } from "../types";

export default defineComponent({
  name: "ChallengePage",

  components: {
    DefaultLayout,
  },

  data() {
    return {
      isLoading: true,
      challengeData: null as ChallengeData | null,
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
      try {
        this.challengeData = {
          title: `Challenge ${this.challengeId} - Placeholder`,
          assignment: "This is a placeholder assignment. The actual challenge content will be loaded from the challenges folder.",
          maxScore: 100,
          showPreview: true,
          mainFile: "main.py",
          files: [
            { filename: "main.py", readonly: false, hidden: false },
          ],
        };
      } catch (error) {
        console.error("Failed to load challenge:", error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center text-gray-400 py-12">
        Loading challenge...
      </div>

      <div v-else-if="challengeData">
        <h2 class="text-3xl font-bold text-white mb-6">{{ challengeData.title }}</h2>
        
        <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-white mb-4">Assignment</h3>
          <div class="text-gray-300" v-html="challengeData.assignment"></div>
        </div>

        <div class="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-white mb-4">Code Editor</h3>
          <p class="text-gray-400">Monaco editor integration will be implemented here.</p>
        </div>
      </div>

      <div v-else class="text-center text-red-400 py-12">
        Failed to load challenge.
      </div>
    </div>
  </DefaultLayout>
</template>
