<template>
  <div class="app-container">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="left-section">
        <span class="logo" @click="goToNotLoggedIn">NurseScripts</span>
      </div>
      <div class="right-section">
        <button class="btn login-btn" @click="goToLogin">Log In</button>
        <img
          src="@/assets/about.png"
          alt="About"
          class="icon-img"
          @click="goToAbout"
        />
      </div>
    </header>

    <!-- About Page Content -->
    <main class="about-container">
      <h1>About NurseScripts</h1>
      <p>
        NurseScripts is a specialized typing practice platform designed for nursing students who want to
        sharpen both their typing speed and medical terminology familiarity. Unlike standard typing tests,
        NurseScripts incorporates real nursing-related scenarios, patient cases, and clinical documentation
        exercises to simulate the environment that nurses often encounter in their daily routines.
      </p>
      <p>
        By practicing on this platform, students enhance not only their typing accuracy but also their
        recognition and recall of essential medical vocabulary. This dual focus helps learners to become
        faster and more confident when dealing with patient records, physician orders, and critical
        documentation that requires both precision and speed.
      </p>
      <p>
        Ultimately, NurseScripts aims to reduce the cognitive load of typing so that nursing students can
        focus more on patient care and decision-making. By mastering typing skills early, students prepare
        themselves for the fast-paced, detail-oriented nature of the healthcare environment, ensuring that
        their documentation is accurate, efficient, and professional.
      </p>
    </main>
  </div>
</template>

<script>
export default {
  name: "AboutNSNoLog",
  methods: {
    goToLogin() {
      this.$router.push("/login");
    },
    goToAbout() {
      // Stay on AboutNSNoLog when clicking the about icon
      this.$router.push("/aboutnsnolog");
    },
    goToNotLoggedIn() {
      // Redirect back to NotLoggedIn.vue
      this.$router.push("/notloggedin");
    }
  }
};
</script>

<style scoped>
.app-container {
  font-family: "Inter", sans-serif;
  background: #f9fbfd;
  color: #333;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.top-bar {
  width: 100%;
  height: 80px;
  background: #f9fbfd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding:  0px 330px;
  box-shadow: none;
}

.logo {
  font-weight: bold;
  font-size: 25px;
  color: #004aad;
  cursor: pointer;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Log In button (copied from NotLoggedIn.vue) */
.btn {
  background: #004aad;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}

.icon-img {
  height: 30px;
  width: auto;
  cursor: pointer;
}

/* About Page Content */
.about-container {
  max-width: 800px;
  margin: 60px auto;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #ddd;
  text-align: justify;
}

.about-container h1 {
  color: #004aad;
  font-size: 28px;
  margin-bottom: 20px;
}
</style>
