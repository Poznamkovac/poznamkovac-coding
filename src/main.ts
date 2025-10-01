import { createApp } from "vue";
import { createPinia } from "pinia";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faHtml5,
  faCss3,
  faJs,
  faPython,
} from "@fortawesome/free-brands-svg-icons";
import { faDatabase, faProjectDiagram } from "@fortawesome/free-solid-svg-icons";

import App from "./App.vue";
import router from "./router";
import "./style.css";

// Configure Monaco Editor workers
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

library.add(faHtml5, faCss3, faJs, faPython, faDatabase, faProjectDiagram);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#app");
