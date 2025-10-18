<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import ChallengeCard from "../components/ChallengeCard.vue";
import CourseCard from "../components/CourseCard.vue";
import { titleCase, hashStringToColor } from "../utils";
import { getPathSegments } from "../utils/route";
import { useLanguage } from "../composables/useLanguage";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";
import type { Course, Challenge } from "../types";
import { storageService } from "../services/storage";

export default defineComponent({
  name: "CoursePage",

  components: {
    DefaultLayout,
    ChallengeCard,
    CourseCard,
  },

  setup() {
    const { t } = useI18n();
    const language = useLanguage();

    return {
      t,
      language,
    };
  },

  data() {
    return {
      isLoading: true,
      subcourses: [] as Course[],
      challenges: [] as Challenge[],
    };
  },

  computed: {
    pathSegments(): string[] {
      return getPathSegments(this.$route);
    },

    coursePath(): string {
      return this.pathSegments.join("/");
    },

    courseTitle(): string {
      const slug = this.pathSegments[this.pathSegments.length - 1] || "Course";
      return titleCase(slug);
    },

    breadcrumbs(): Array<{ text: string; path: string }> {
      return useBreadcrumbs(this.$route, this.t("home.courses"), true).value;
    },
  },

  watch: {
    "$route.params.pathMatch": {
      handler() {
        this.loadCourseData();
      },
    },
  },

  mounted() {
    this.loadCourseData();
  },

  methods: {
    async loadCourseData() {
      this.isLoading = true;
      try {
        this.subcourses = [];
        this.challenges = [];

        // Load from index.json for better performance
        const response = await fetch("/index.json");
        if (!response.ok) {
          throw new Error("Failed to load course index");
        }

        const courseIndex = await response.json();
        const lang = this.language === "auto" ? "sk" : this.language;
        const courses = courseIndex[lang] || [];

        // Find the course by path
        const course = this.findCourseByPath(courses, this.coursePath);

        if (course) {
          // Load subcourses if any
          if (course.subcourses && course.subcourses.length > 0) {
            this.subcourses = course.subcourses.map((sub: any) => ({
              slug: sub.path, // Use full path instead of just slug
              title: sub.title,
              color: hashStringToColor(sub.slug),
              challengeCount: sub.challengeCount,
            }));
          }

          // Load challenges if any
          if (course.challenges && course.challenges.length > 0) {
            this.challenges = await Promise.all(
              course.challenges.map(async (challenge: any) => {
                const challengeId = challenge.id;
                const score = await storageService.getChallengeScore(this.coursePath, challengeId, this.language as "sk" | "en");

                return {
                  id: parseInt(challengeId, 10),
                  title: challenge.title,
                  maxScore: challenge.maxScore || 10,
                  currentScore: score || 0,
                };
              }),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load course data:", error);
      } finally {
        this.isLoading = false;
      }
    },

    findCourseByPath(courses: any[], targetPath: string): any | null {
      for (const course of courses) {
        if (course.path === targetPath) {
          return course;
        }

        // Check subcourses recursively
        if (course.subcourses && course.subcourses.length > 0) {
          const found = this.findCourseByPath(course.subcourses, targetPath);
          if (found) return found;
        }
      }
      return null;
    },

    navigateTo(path: string) {
      this.$router.push(path);
    },
  },
});
</script>

<template>
  <DefaultLayout>
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <button
            v-if="index < breadcrumbs.length - 1"
            class="text-blue-400 hover:text-blue-300 transition-colors"
            @click="navigateTo(crumb.path)"
          >
            {{ crumb.text }}
          </button>
          <span v-else class="text-gray-400">{{ crumb.text }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="text-gray-600">/</span>
        </template>
      </nav>

      <h2 class="text-3xl font-bold text-white mb-8">
        {{ courseTitle }}
      </h2>

      <div v-if="isLoading" class="text-center text-gray-400 py-12">
        {{ t("common.loading") }}
      </div>

      <div v-else>
        <div v-if="subcourses.length > 0" class="mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">
            {{ t("course.subcourses") }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard v-for="course in subcourses" :key="course.slug" :course="course" />
          </div>
        </div>

        <div v-if="challenges.length > 0">
          <h3 class="text-xl font-semibold text-white mb-4">
            {{ t("course.challenges") }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChallengeCard v-for="challenge in challenges" :key="challenge.id" :challenge="challenge" :course-path="coursePath" />
          </div>
        </div>

        <div v-if="subcourses.length === 0 && challenges.length === 0" class="text-center text-gray-400 py-12">
          {{ t("course.noContent") }}
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
