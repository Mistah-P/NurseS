<template>
  <div class="app-container">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="left-section">
        <span class="logo" @click="goToHome" style="cursor: pointer;">NurseScripts</span>
      </div>
      <div class="right-section">
        <!-- Username (tooltip: User page) -->
        <a
          @click="$router.push('/user')"
          style="cursor: pointer; text-decoration: none; color: inherit;"
          title="User page"
          aria-label="User page"
        >
          {{ username }}
        </a>

        <!-- Progress Circle -->
        <div class="progress-circle" title="Progress" aria-label="Progress">
          <span class="progress-number">5</span>
        </div>

        <!-- Icons with hover tooltips -->
        <img
          src="@/assets/settings.png"
          alt="Settings"
          class="icon-img"
          title="Settings"
          aria-label="Settings"
          @click="goToSettings"
        />
        <img
          src="@/assets/highscore.png"
          alt="Highscore"
          class="icon-img"
          title="Highscore"
          aria-label="Highscore"
          @click="goToHighscore"
        />
        <img
          src="@/assets/about.png"
          alt="About"
          class="icon-img"
          title="About"
          aria-label="About"
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
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default {
  name: "AboutNS",
  data() {
    return {
      username: "", // Dynamically fetched username
    };
  },
  methods: {
    async fetchUsername() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const db = getFirestore();
        const userDoc = doc(db, "users", user.uid); // Replace "users" with your Firestore collection name
        try {
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            this.username = docSnap.data().name; // Fetch the name field from Firestore
          } else {
            console.error("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("No user is logged in.");
      }
    },
    goToSettings() {
      this.$router.push("/settings");
    },
    goToHome() {
      this.$router.push("/loggedin");
    },
    goToHighscore() {
      this.$router.push("/highscore");
    },
    goToAbout() {
      this.$router.push("/aboutns");
    },
  },
  async mounted() {
    await this.fetchUsername(); // Fetch the username when the component is mounted
  },
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
  padding: 0px 215px;
  box-shadow: none;
}

.logo {
  font-weight: bold;
  font-size: 25px;
  color: #2D539E;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Username */
.username {
  font-weight: normal;
  font-size: 18px;
  color: #333;
}

/* Progress Circle */
.progress-circle {
  width: 30px;
  height: 30px;
  background-color: #2D539E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-number {
  color: white;
  font-weight: bold;
  font-size: 15px;
}

.icon-img {
  height: 30px;
  width: auto;
  cursor: pointer;
}

/* About Page Content */
.about-container {
  color: #555;
  max-width: 800px;
  margin: 60px auto;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #ddd;
  text-align: justify;
  font-size: 20px;
}

.about-container h1 {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #2D539E;
  margin-bottom: 20px;
}
</style>
