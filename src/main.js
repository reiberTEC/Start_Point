import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { reveal, tilt, parallax } from "./directives/motion";
import "leaflet/dist/leaflet.css";
import "./style.css";

createApp(App)
  .use(router)
  .directive("reveal", reveal)
  .directive("tilt", tilt)
  .directive("parallax", parallax)
  .mount("#app");
