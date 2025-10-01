<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "EmbedLayout",
});
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <slot />
  </div>
</template>
