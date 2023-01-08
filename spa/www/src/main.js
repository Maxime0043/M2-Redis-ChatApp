import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { plugin, defaultConfig } from "@formkit/vue";
import "@formkit/themes/genesis";
import axios from "axios";
import 'bootstrap-icons/font/bootstrap-icons.css'


const app = createApp(App)
app.use(plugin, defaultConfig);
app.use(router)

app.mount('#app')