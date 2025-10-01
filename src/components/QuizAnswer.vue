<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { QuizAnswerConfig } from "../types";

export default defineComponent({
  name: "QuizAnswer",

  props: {
    config: {
      type: Object as PropType<QuizAnswerConfig>,
      required: true,
    },
    modelValue: {
      type: [String, Array] as PropType<string | string[]>,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["update:modelValue"],

  computed: {
    localValue: {
      get(): string | string[] {
        return this.modelValue;
      },
      set(value: string | string[]) {
        this.$emit("update:modelValue", value);
      },
    },
  },

  methods: {
    handleRadioChange(optionId: string) {
      this.localValue = optionId;
    },

    handleCheckboxChange(optionId: string) {
      const current = Array.isArray(this.localValue) ? this.localValue : [];
      const index = current.indexOf(optionId);

      if (index > -1) {
        this.localValue = current.filter((id) => id !== optionId);
      } else {
        this.localValue = [...current, optionId];
      }
    },

    handleInputChange(event: Event) {
      const target = event.target as HTMLInputElement;
      this.localValue = target.value;
    },

    isChecked(optionId: string): boolean {
      if (this.config.type === "radio") {
        return this.localValue === optionId;
      } else if (this.config.type === "checkbox") {
        return Array.isArray(this.localValue) && this.localValue.includes(optionId);
      }
      return false;
    },
  },
});
</script>

<template>
  <div class="quiz-answer">
    <div v-if="config.type === 'radio' && config.options" class="space-y-3">
      <label
        v-for="option in config.options"
        :key="option.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
        :class="{ 'bg-gray-800': isChecked(option.id) }"
      >
        <input
          type="radio"
          :value="option.id"
          :checked="isChecked(option.id)"
          :disabled="disabled"
          @change="handleRadioChange(option.id)"
          class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
        />
        <span class="text-gray-200">{{ option.text }}</span>
      </label>
    </div>

    <div v-else-if="config.type === 'checkbox' && config.options" class="space-y-3">
      <label
        v-for="option in config.options"
        :key="option.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
        :class="{ 'bg-gray-800': isChecked(option.id) }"
      >
        <input
          type="checkbox"
          :value="option.id"
          :checked="isChecked(option.id)"
          :disabled="disabled"
          @change="handleCheckboxChange(option.id)"
          class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <span class="text-gray-200">{{ option.text }}</span>
      </label>
    </div>

    <div v-else-if="config.type === 'input'" class="space-y-2">
      <input
        type="text"
        :value="typeof localValue === 'string' ? localValue : ''"
        :disabled="disabled"
        @input="handleInputChange"
        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        placeholder="Zadajte odpoveď..."
      />
      <div v-if="!config.caseSensitive || !config.diacriticSensitive" class="text-sm text-gray-500">
        <span v-if="!config.caseSensitive">Ignoruje veľkosť písmen</span>
        <span v-if="!config.caseSensitive && !config.diacriticSensitive"> • </span>
        <span v-if="!config.diacriticSensitive">Ignoruje diakritiku</span>
      </div>
    </div>
  </div>
</template>
