<template>
  <div id="app">
    <!-- Global Header - persistent across all routes -->
    <GlobalHeader v-if="shouldShowHeader" />
    
    <!-- All route pages will be injected here -->
    <router-view />
  </div>
</template>

<script>
import GlobalHeader from './components/GlobalHeader.vue'
import themeService from './services/themeService'

export default {
  name: "App",
  components: {
    GlobalHeader
  },
  computed: {
    shouldShowHeader() {
      // Show header on student pages, hide on login/register/landing pages
      const studentRoutes = ['/user', '/practice-mode', '/ai-patient', '/settings']
      return studentRoutes.includes(this.$route.path)
    }
  },
  mounted() {
    // Initialize theme service when app mounts
    // Theme service will automatically load user preferences
  },
  beforeUnmount() {
    // Cleanup theme service when app unmounts
    themeService.destroy()
  }
};
</script>

<style>
/* CSS Custom Properties for Theme System */
:root {
  /* Default theme variables will be set by themeService */
  /* These are fallbacks in case theme service hasn't loaded yet */
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-tertiary: #4a5568;
  --bg-card: #2d3748;
  --bg-header: linear-gradient(135deg, #252939 0%, #48454b 100%);
  --bg-sidebar: #1a1d29;
  --bg-input: #1a202c;
  --bg-button: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  --bg-button-hover: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  
  --text-primary: #ffffff;
  --text-secondary: #e2e8f0;
  --text-tertiary: #a0aec0;
  --text-inverse: #1a202c;
  
  --border-primary: #4a5568;
  --border-secondary: #2d3748;
  --border-focus: #48bb78;
  
  --accent-primary: #48bb78;
  --accent-success: #48bb78;
  --accent-warning: #ed8936;
  --accent-error: #f56565;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}

/* Global styles using CSS variables */
body {
  margin: 0;
  font-family: "Inter", sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Ensure smooth transitions for theme changes */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Theme-specific overrides */
[data-theme="light"] {
  /* Light theme specific styles if needed */
}

[data-theme="dark"] {
  /* Dark theme specific styles if needed */
}
</style>
