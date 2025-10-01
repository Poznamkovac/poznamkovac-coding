<script lang="ts">
import { defineComponent } from "vue";
import * as monaco from "monaco-editor";

export default defineComponent({
  name: "CodeEditor",

  props: {
    content: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["update:content"],

  data() {
    return {
      editor: null as monaco.editor.IStandaloneCodeEditor | null,
      updateTimer: null as number | null,
    };
  },

  computed: {
    language(): string {
      const ext = this.filename.split(".").pop()?.toLowerCase() || "";
      const langMap: Record<string, string> = {
        html: "html",
        css: "css",
        js: "javascript",
        ts: "typescript",
        json: "json",
        md: "markdown",
        py: "python",
        sql: "sql",
        lua: "lua",
        txt: "plaintext",
      };
      return langMap[ext] || "plaintext";
    },
  },

  watch: {
    content(newContent) {
      if (this.editor && this.editor.getValue() !== newContent) {
        this.editor.setValue(newContent);
      }
    },

    filename() {
      this.updateLanguage();
    },

    readonly(newValue) {
      if (this.editor) {
        this.editor.updateOptions({ readOnly: newValue });
      }
    },
  },

  mounted() {
    this.initEditor();
  },

  beforeUnmount() {
    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }
    if (this.editor) {
      this.editor.dispose();
    }
  },

  methods: {
    initEditor() {
      const container = this.$refs.editorContainer as HTMLElement;
      if (!container) return;

      this.editor = monaco.editor.create(container, {
        value: this.content,
        language: this.language,
        theme: "vs-dark",
        readOnly: this.readonly,
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
      });

      this.editor.onDidChangeModelContent(() => {
        this.handleContentChange();
      });
    },

    handleContentChange() {
      if (this.updateTimer) {
        window.clearTimeout(this.updateTimer);
      }

      this.updateTimer = window.setTimeout(() => {
        if (this.editor) {
          const newContent = this.editor.getValue();
          this.$emit("update:content", newContent);
        }
      }, 300);
    },

    updateLanguage() {
      if (this.editor) {
        const model = this.editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, this.language);
        }
      }
    },
  },
});
</script>

<template>
  <div class="code-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<style scoped>
.code-editor {
  height: 100%;
  width: 100%;
}

.editor-container {
  height: 100%;
  width: 100%;
}
</style>
