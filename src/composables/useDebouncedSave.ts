import { ref, onUnmounted } from "vue";

export function useDebouncedSave(delay = 500) {
  const saveTimer = ref<number | null>(null);

  const clearTimer = () => {
    if (saveTimer.value) {
      window.clearTimeout(saveTimer.value);
      saveTimer.value = null;
    }
  };

  const debouncedSave = (callback: () => void) => {
    clearTimer();
    saveTimer.value = window.setTimeout(() => {
      callback();
      saveTimer.value = null;
    }, delay);
  };

  onUnmounted(clearTimer);

  return { debouncedSave, clearTimer };
}
