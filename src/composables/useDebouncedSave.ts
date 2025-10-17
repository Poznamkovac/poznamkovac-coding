import { ref, onUnmounted } from "vue";

export function useDebouncedSave(delay = 500) {
  const saveTimer = ref<number | null>(null);

  const debouncedSave = (callback: () => void) => {
    if (saveTimer.value) {
      window.clearTimeout(saveTimer.value);
    }

    saveTimer.value = window.setTimeout(() => {
      callback();
      saveTimer.value = null;
    }, delay);
  };

  const clearTimer = () => {
    if (saveTimer.value) {
      window.clearTimeout(saveTimer.value);
      saveTimer.value = null;
    }
  };

  onUnmounted(() => {
    clearTimer();
  });

  return {
    debouncedSave,
    clearTimer,
  };
}
