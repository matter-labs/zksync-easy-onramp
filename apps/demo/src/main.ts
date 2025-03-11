import "./assets/main.css";
import "vue-final-modal/style.css";

import { WagmiPlugin, } from "@wagmi/vue";
import { createPinia, } from "pinia";
import { createApp, } from "vue";
import { createVfm, } from "vue-final-modal";
import { VueSpinnersPlugin, } from "vue3-spinners";

import App from "./App.vue";
import router from "./router";
import { wagmiAdapter, } from "./utils/wagmi-adapter";

const app = createApp(App,);

app.use(createPinia(),);
app.use(router,);
app.use(VueSpinnersPlugin,);
app.use(createVfm(),);
app.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig, },);

app.mount("#app",);
