import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import apiClient from './plugins/axios';
import { appName } from '@/config/app';
import '@tabler/core/dist/css/tabler.min.css';
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import '@tabler/core/dist/js/tabler.min.js';
import '@/assets/styles/main.scss';
import faviconUrl from '@/assets/images/favicon.png';

const app = createApp(App);

app.config.globalProperties.$api = apiClient;
app.use(router);

document.title = appName;

const faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
faviconLink.type = 'image/png';
faviconLink.rel = 'icon';
faviconLink.href = faviconUrl;
document.head.appendChild(faviconLink);

app.mount('#app');
