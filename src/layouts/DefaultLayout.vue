<script setup lang="ts">
import AppHeader from "../components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <AppHeader />
    <main>
      <slot />
    </main>
  </div>
</template>
