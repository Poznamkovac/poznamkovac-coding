<script lang="ts">
import { defineComponent } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";

export default defineComponent({
  name: "CreateEmbedPage",

  components: {
    DefaultLayout,
  },
});
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold text-white mb-4">Create Custom Embed</h2>
      <p class="text-gray-400">UI to create custom embeddable challenges will be implemented here.</p>
    </div>
  </DefaultLayout>
</template>
