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

library.add(faHtml5, faCss3, faJs, faPython, faDatabase, faProjectDiagram);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#app");
