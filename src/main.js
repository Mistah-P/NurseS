// import { createApp } from 'vue'
// import App from './App.vue'
// import router from './router'
// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// createApp(App).use(router).mount('#app')


import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { roomAPI, studentAPI, healthCheck } from './services/api';

const app = createApp(App);

// Make API services available globally
app.config.globalProperties.$roomAPI = roomAPI;
app.config.globalProperties.$studentAPI = studentAPI;
app.config.globalProperties.$healthCheck = healthCheck;

app.use(router).mount('#app');

