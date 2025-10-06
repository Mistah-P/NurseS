<template>
  <div id="app">
    <!-- All route pages (like AboutNS.vue, Highscore.vue, etc.) will be injected here -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
body {
  margin: 0;
  font-family: "Inter", sans-serif;
  background: #f9fbfd;
}
</style>
