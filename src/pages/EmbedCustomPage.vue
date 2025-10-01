<script lang="ts">
import { defineComponent } from "vue";
import EmbedLayout from "../layouts/EmbedLayout.vue";

export default defineComponent({
  name: "EmbedCustomPage",

  components: {
    EmbedLayout,
  },
});
</script>

<template>
  <EmbedLayout>
    <div class="container mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold text-white mb-4">Custom Embed Challenge</h2>
      <p class="text-gray-400">Placeholder for custom challenge from URL parameters.</p>
    </div>
  </EmbedLayout>
</template>
