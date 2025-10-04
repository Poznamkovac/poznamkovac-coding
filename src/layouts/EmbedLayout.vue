<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "EmbedLayout",
});
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <slot />
  </div>
</template>
