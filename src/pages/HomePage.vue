<script setup lang="ts">
import { ref, onMounted } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import CourseCard from "../components/CourseCard.vue";
import { useI18n } from "../composables/useI18n";
import { hashStringToColor } from "../utils";
import type { Course } from "../types";

const { t } = useI18n();
const courses = ref<Course[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  await loadCourses();
});

async function loadCourses() {
  try {
    courses.value = [
      { slug: "python", title: "Python", color: hashStringToColor("python"), challengeCount: 0 },
      { slug: "web", title: "Web Development", color: hashStringToColor("web"), challengeCount: 0 },
      { slug: "sqlite", title: "SQLite", color: hashStringToColor("sqlite"), challengeCount: 0 },
      { slug: "uml", title: "UML Diagrams", color: hashStringToColor("uml"), challengeCount: 0 },
    ];
  } catch (error) {
    console.error("Failed to load courses:", error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-8">
      <h2 class="text-3xl font-bold text-white mb-8">{{ t("home.courses") || "Courses" }}</h2>
      
      <div v-if="isLoading" class="text-center text-gray-400 py-12">
        Loading courses...
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard v-for="course in courses" :key="course.slug" :course="course" />
      </div>
    </div>
  </DefaultLayout>
</template>
