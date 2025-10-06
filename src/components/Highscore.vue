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

    <!-- High Score Content -->
    <div class="highscore-container">
      <h1 class="highscore-title">Leaderboard</h1>
      <p class="description">
        Check out the top typists from the past few days! They’re ranked by their overall typing scores, 
        which factor in speed, text length, character variety, and accuracy. 
        The scoring system rewards fast, accurate typing on longer, more complex texts, so the fewer mistakes, the higher the score!
      </p>

      <table class="highscore-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
            <th>WPM</th>
            <th>Accuracy</th>
            <th>Consistency</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(player, index) in players"
            :key="index"
            :class="{ highlight: player.username === username }"
          >
            <td>{{ index + 1 }}</td>
            <td>{{ player.username }}</td>
            <td>{{ player.score }}</td>
            <td>{{ player.wpm }}</td>
            <td>{{ player.accuracy }}%</td>
            <td>{{ player.consistency }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default {
  name: "HighScorePage",
  data() {
    return {
      username: "", // Dynamically fetched username
      players: [
        { username: "PeterParker", score: 1200, wpm: 92, accuracy: 98, consistency: 95 },
        { username: "TonyStark", score: 1100, wpm: 89, accuracy: 97, consistency: 94 },
        { username: "Natasha", score: 1050, wpm: 85, accuracy: 96, consistency: 92 },
        { username: "BruceBanner", score: 1000, wpm: 80, accuracy: 95, consistency: 90 },
        { username: "GwenStacy", score: 980, wpm: 78, accuracy: 94, consistency: 91 },
        { username: "ClintBarton", score: 900, wpm: 75, accuracy: 92, consistency: 89 },
        { username: "SteveRogers", score: 850, wpm: 70, accuracy: 91, consistency: 88 },
        { username: "Wanda", score: 820, wpm: 68, accuracy: 90, consistency: 87 },
        { username: "Vision", score: 800, wpm: 67, accuracy: 89, consistency: 85 },
        { username: "Thor", score: 780, wpm: 65, accuracy: 88, consistency: 84 }
      ]
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
    goToLoggedIn() {
      this.$router.push("/loggedin");
    },
    goToUserPage() {
      this.$router.push("/user");
    },
    goToAbout() {
      this.$router.push("/aboutns");
    }
  },
  async mounted() {
    await this.fetchUsername(); // Fetch the username when the component is mounted
  }
};
</script>

<style scoped>
.app-container {
  font-family: "Inter", sans-serif;
  background: #f9fbfd;
  min-height: 100vh;
  color: #333;
}

/* Top Bar */
.top-bar {
  width: 100%;
  height: 80px;
  background: #f9fbfd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 215px;
}

.logo {
  font-weight: bold;
  font-size: 25px;
  color: #2D539E;
  cursor: pointer;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  font-size: 16px;
  color: #333;
  cursor: pointer;
  text-decoration: none;
}

.username:hover {
  text-decoration: none;
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

/* Icons */
.icon-img {
  height: 30px;
  width: auto;
  cursor: pointer;
}

/* High Score Table */
.highscore-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.highscore-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #2D539E;
  margin-bottom: 10px;
}

.description {
  text-align: center;
  font-size: 16px;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.5;
  padding: 0 15px;
}

.highscore-table {
  width: 100%;
  border-collapse: collapse;
}

.highscore-table th,
.highscore-table td {
  padding: 12px 15px;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
}

.highscore-table th {
  background-color: #f4f6fa;
  font-weight: bold;
  color: #333;
}

.highlight {
  background-color: #e8f0fe;
  font-weight: bold;
}
</style>
