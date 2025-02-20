import "./assets/main.css";

import { createPinia, } from "pinia";
import { createApp, } from "vue";
import { VueSpinnersPlugin, } from "vue3-spinners";
import { createOnRampConfig, } from "zksync-easy-onramp-sdk";

import App from "./App.vue";
import router from "./router";

createOnRampConfig({
  integrator: "ZKsync Easy OnRamp Demo",
  services: ["kado",],
  dev: true,
},);

const app = createApp(App,);

app.use(createPinia(),);
app.use(router,);
app.use(VueSpinnersPlugin,);

app.mount("#app",);
