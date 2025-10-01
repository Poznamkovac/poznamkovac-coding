<script lang="ts">
import { defineComponent } from "vue";
import AppHeader from "../components/AppHeader.vue";

export default defineComponent({
  name: "DefaultLayout",

  components: {
    AppHeader,
  },
});
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <AppHeader />
    <main>
      <slot />
    </main>
  </div>
</template>
