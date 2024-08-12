import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";


// rýchly fix pre 4 MB monaco-editor
// chunkov bude viac (pretože stále zahŕňame všetky jazyky, atď...),
// ale na stránke sa načítajú iba tie ktoré potrebujeme (HTML, CSS, JS)
let monacoChunk = 0;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules")) {
            if (id.includes("monaco-editor")) {
              monacoChunk++;
              return `monaco-editor-${monacoChunk}`;
            }
            return id.split("node_modules/")[1].split("/")[0];
          }
        },
      },
    },
  },
});
