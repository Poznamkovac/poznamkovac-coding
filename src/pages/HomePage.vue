<script lang="ts">
import { useI18n } from "vue-i18n";
import { defineComponent } from "vue";
import { storeToRefs } from "pinia";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import CourseCard from "../components/CourseCard.vue";
import { useI18nStore } from "../stores/i18n";
import { hashStringToColor } from "../utils";
import type { Course } from "../types";

export default defineComponent({
  name: "HomePage",

  components: {
    DefaultLayout,
    CourseCard,
  },

  setup() {
    const { t } = useI18n();
    const i18nStore = useI18nStore();
    const { language } = storeToRefs(i18nStore);

    return {
      t,
      i18nStore,
      language,
    };
  },

  data() {
    return {
      courses: [] as Course[],
      isLoading: true,
    };
  },

  watch: {
    language() {
      this.loadCourses();
    },
  },

  mounted() {
    this.loadCourses();
  },

  methods: {
    async loadCourses() {
      this.isLoading = true;
      try {
        // Load course index from build-time generated file
        const response = await fetch("/index.json");
        if (!response.ok) {
          throw new Error("Failed to load course index");
        }

        const courseIndex = await response.json();
        const lang = this.language === "auto" ? "sk" : this.language;
        const coursesData = courseIndex[lang] || [];

        // Transform to Course type with colors
        this.courses = coursesData.map((course: any) => ({
          slug: course.slug,
          title: course.title,
          color: hashStringToColor(course.slug),
          challengeCount: course.challengeCount,
        }));
      } catch (error) {
        console.error("Failed to load courses:", error);
        this.courses = [];
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
      <h2 class="text-3xl font-bold text-white mb-8">{{ t("home.courses") }}</h2>

      <div v-if="isLoading" class="text-center text-gray-400 py-12">Loading courses...</div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard v-for="course in courses" :key="course.slug" :course="course" />
      </div>
    </div>
  </DefaultLayout>
</template>
