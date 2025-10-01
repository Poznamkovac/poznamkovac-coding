import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 4500,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
