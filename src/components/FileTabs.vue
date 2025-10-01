<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { VirtualFile } from "../services/virtualFileSystem";

export default defineComponent({
  name: "FileTabs",

  props: {
    files: {
      type: Array as PropType<VirtualFile[]>,
      required: true,
    },
    activeFile: {
      type: String as PropType<string | null>,
      default: null,
    },
  },

  emits: ["file-select", "file-add", "file-remove"],

  data() {
    return {
      newFileName: "",
      showAddDialog: false,
    };
  },

  methods: {
    selectFile(filename: string) {
      this.$emit("file-select", filename);
    },

    removeFile(filename: string, event: Event) {
      event.stopPropagation();
      this.$emit("file-remove", filename);
    },

    showAddFileDialog() {
      this.showAddDialog = true;
      this.newFileName = "";
      this.$nextTick(() => {
        const input = this.$refs.newFileInput as HTMLInputElement;
        if (input) input.focus();
      });
    },

    addFile() {
      if (this.newFileName.trim()) {
        this.$emit("file-add", this.newFileName.trim());
        this.showAddDialog = false;
        this.newFileName = "";
      }
    },

    cancelAdd() {
      this.showAddDialog = false;
      this.newFileName = "";
    },
  },
});
</script>

<template>
  <div class="file-tabs">
    <div class="tabs-container">
      <button
        v-for="file in files"
        :key="file.filename"
        class="tab"
        :class="{ active: file.filename === activeFile }"
        @click="selectFile(file.filename)"
      >
        <span class="tab-name">{{ file.filename }}</span>
        <button
          v-if="!file.readonly && file.removable !== false"
          class="tab-remove"
          @click="removeFile(file.filename, $event)"
          title="Odstrániť súbor"
        >
          ×
        </button>
      </button>

      <button class="tab tab-add" @click="showAddFileDialog" title="Pridať súbor">
        +
      </button>
    </div>

    <!-- Add file dialog -->
    <div v-if="showAddDialog" class="add-dialog-overlay" @click="cancelAdd">
      <div class="add-dialog" @click.stop>
        <h3 class="text-white mb-3">Nový súbor</h3>
        <input
          ref="newFileInput"
          v-model="newFileName"
          type="text"
          placeholder="názov-súboru.py"
          class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white mb-3"
          @keyup.enter="addFile"
          @keyup.esc="cancelAdd"
        />
        <div class="flex gap-2">
          <button
            @click="addFile"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
          >
            Pridať
          </button>
          <button
            @click="cancelAdd"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Zrušiť
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-tabs {
  background-color: #1e1e1e;
  border-bottom: 1px solid #2d2d2d;
}

.tabs-container {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #1e1e1e;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2d2d2d;
  border: none;
  border-right: 1px solid #1e1e1e;
  color: #cccccc;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.tab:hover {
  background: #37373d;
}

.tab.active {
  background: #1e1e1e;
  color: #ffffff;
}

.tab-name {
  font-size: 13px;
  font-family: "Consolas", "Monaco", monospace;
}

.tab-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: #cccccc;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.tab-remove:hover {
  background: #505050;
  color: #ffffff;
}

.tab-add {
  background: #2d2d2d;
  color: #cccccc;
  font-size: 20px;
  padding: 8px 16px;
}

.tab-add:hover {
  background: #37373d;
  color: #ffffff;
}

.add-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-dialog {
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
</style>
