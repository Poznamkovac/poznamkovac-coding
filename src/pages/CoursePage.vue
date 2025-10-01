<script lang="ts">
import { defineComponent } from "vue";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import ChallengeCard from "../components/ChallengeCard.vue";
import CourseCard from "../components/CourseCard.vue";
import { titleCase } from "../utils";
import { useI18nStore } from "../stores/i18n";
import { storeToRefs } from "pinia";
import type { Course, Challenge } from "../types";

export default defineComponent({
  name: "CoursePage",

  components: {
    DefaultLayout,
    ChallengeCard,
    CourseCard,
  },

  setup() {
    const i18nStore = useI18nStore();
    const { language } = storeToRefs(i18nStore);

    return {
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
    coursePath(): string {
      const match = this.$route.params.pathMatch;
      return Array.isArray(match) ? match.join("/") : match || "";
    },

    courseTitle(): string {
      const segments = this.coursePath.split("/");
      const slug = segments[segments.length - 1] || "Course";
      return titleCase(slug);
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

        // Try to load challenges for this course
        const challengeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const loadedChallenges: typeof this.challenges = [];

        for (const id of challengeIds) {
          try {
            const response = await fetch(`/${this.language}/challenges/${this.coursePath}/${id}/assignment.json`);
            if (response.ok) {
              const data = await response.json();
              loadedChallenges.push({
                id,
                title: data.title,
                maxScore: data.maxScore,
                currentScore: 0,
              });
            }
          } catch (err) {
            // Challenge doesn't exist, skip it
          }
        }

        this.challenges = loadedChallenges;
      } catch (error) {
        console.error("Failed to load course data:", error);
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
      <h2 class="text-3xl font-bold text-white mb-8">{{ courseTitle }}</h2>
      
      <div v-if="isLoading" class="text-center text-gray-400 py-12">
        Loading...
      </div>

      <div v-else>
        <div v-if="subcourses.length > 0" class="mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">Subcourses</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard v-for="course in subcourses" :key="course.slug" :course="course" />
          </div>
        </div>

        <div v-if="challenges.length > 0">
          <h3 class="text-xl font-semibold text-white mb-4">Challenges</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChallengeCard
              v-for="challenge in challenges"
              :key="challenge.id"
              :challenge="challenge"
              :course-path="coursePath"
            />
          </div>
        </div>

        <div v-if="subcourses.length === 0 && challenges.length === 0" class="text-center text-gray-400 py-12">
          No content found in this course.
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>
