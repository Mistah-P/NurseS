<template>
  <div class="app-container">
    <!-- Top Bar (copied style/behavior from other pages) -->
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

    <!-- Results Content -->
    <main class="results-container">
      <header class="results-header">
        <h1>Typing Test Results</h1>
        <p class="subtitle">
          Great work, {{ username }}! Here’s a breakdown of your performance.
        </p>
      </header>

      <section class="score-hero">
        <div class="wpm-card">
          <div class="wpm-number">{{ displayWPM }}</div>
          <div class="wpm-label">WPM</div>
        </div>
        <div class="hero-metrics">
          <div class="metric">
            <div class="metric-top">
              <span>Accuracy</span>
              <strong>{{ displayAccuracy }}%</strong>
            </div>
            <div class="bar">
              <div class="bar-fill" :style="{ width: displayAccuracy + '%' }"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-top">
              <span>Time</span>
              <strong>{{ displayTime }}s</strong>
            </div>
            <div class="bar">
              <div class="bar-fill time" :style="{ width: timePct + '%' }"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-top">
              <span>Error Rate</span>
              <strong>{{ errorRate }}%</strong>
            </div>
            <div class="bar">
              <div class="bar-fill error" :style="{ width: errorRate + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="stat-grid">
        <div class="stat">
          <div class="stat-label">Gross CPM</div>
          <div class="stat-value">{{ grossCPM }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Net CPM</div>
          <div class="stat-value">{{ netCPM }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Keystrokes</div>
          <div class="stat-value">{{ keystrokes }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Correct</div>
          <div class="stat-value good">{{ correct }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Incorrect</div>
          <div class="stat-value bad">{{ incorrect }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Backspaces</div>
          <div class="stat-value">{{ backspaces }}</div>
        </div>
      </section>

      <section class="tagline">
        <p>
          Practice with <strong>clinical vocabulary</strong> pays off—keep going to boost both documentation speed and accuracy.
        </p>
      </section>

      <section class="actions">
        <button class="btn secondary" @click="goToHighscore">View Highscores</button>
        <button class="btn primary" @click="tryAgain">Try Again</button>
      </section>
    </main>
  </div>
</template>

<script>
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { getAuth } from "firebase/auth"; // Import Firebase Auth

export default {
  name: "TypingResults",
  data() {
    return {
      username: "", // Initialize as empty
      // Fallback defaults if route doesn’t provide query params
      defaults: {
        wpm: 52,
        accuracy: 94,
        time: 60, // seconds
        correct: 280,
        incorrect: 18,
        backspaces: 25,
      },
    };
  },
  computed: {
    // Parse from route query (?wpm=..&accuracy=..&time=.. etc.) with sensible fallbacks
    displayWPM() {
      const q = Number(this.$route.query.wpm);
      return Number.isFinite(q) ? Math.max(0, Math.round(q)) : this.defaults.wpm;
    },
    displayAccuracy() {
      const q = Number(this.$route.query.accuracy);
      const val = Number.isFinite(q) ? q : this.defaults.accuracy;
      return Math.min(100, Math.max(0, Math.round(val)));
    },
    displayTime() {
      const q = Number(this.$route.query.time);
      return Number.isFinite(q) ? Math.max(1, Math.round(q)) : this.defaults.time;
    },
    correct() {
      const q = Number(this.$route.query.correct);
      return Number.isFinite(q) ? Math.max(0, Math.round(q)) : this.defaults.correct;
    },
    incorrect() {
      const q = Number(this.$route.query.incorrect);
      return Number.isFinite(q) ? Math.max(0, Math.round(q)) : this.defaults.incorrect;
    },
    backspaces() {
      const q = Number(this.$route.query.backspaces);
      return Number.isFinite(q) ? Math.max(0, Math.round(q)) : this.defaults.backspaces;
    },
    keystrokes() {
      return this.correct + this.incorrect;
    },
    timePct() {
      // For the bar only (relative to 120s cap for nice visuals)
      const cap = 120;
      return Math.min(100, Math.round((this.displayTime / cap) * 100));
    },
    errorRate() {
      const total = this.keystrokes || 1;
      return Math.round((this.incorrect / total) * 100);
    },
    grossCPM() {
      // characters per minute (gross): keystrokes / time(min)
      const minutes = this.displayTime / 60;
      return Math.max(0, Math.round(this.keystrokes / (minutes || 1)));
    },
    netCPM() {
      // approximate: correct chars per minute
      const minutes = this.displayTime / 60;
      return Math.max(0, Math.round(this.correct / (minutes || 1)));
    },
  },
  methods: {
    // Navigation from top bar
    goToSettings() {
      this.$router.push("/settings");
    },
    goToHighscore() {
      this.$router.push("/highscore");
    },
    goToAbout() {
      this.$router.push("/aboutns");
    },
    goToLoggedIn() {
      this.$router.push("/loggedin");
    },
    goToUserPage() {
      this.$router.push("/user");
    },

    // Actions
    tryAgain() {
      // Go back to the previous page (the test the user came from).
      // Fallback to a sensible page if there is no history entry.
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        const fallback = this.$route.query.prev || "/loggedin";
        this.$router.push(fallback);
      }
    },
    goToCustomize() {
      this.$router.push("/customize");
    },
    async shareResult() {
      const url = window.location.origin + this.$router.resolve({ name: "LoggedIn" }).href;
      const text = `I just scored ${this.displayWPM} WPM at ${this.displayAccuracy}% accuracy on NurseScripts!`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "My NurseScripts Result", text, url });
        } else {
          await navigator.clipboard.writeText(`${text} ${url}`);
          alert("Result copied to clipboard!");
        }
      } catch {
        // User canceled share
      }
    },
    async fetchUsername() {
      try {
        const auth = getAuth(); // Get Firebase Auth instance
        const userId = auth.currentUser?.uid; // Get the current user's ID
        if (!userId) {
          console.error("User is not logged in.");
          return;
        }

        const db = getFirestore(); // Get Firestore instance
        const userDocRef = doc(db, `users/${userId}`); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document

        if (userDoc.exists()) {
          this.username = userDoc.data().name; // Set the username from Firestore
        } else {
          console.error("No user document found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    },
  },
  async created() {
    await this.fetchUsername(); // Fetch the username when the component is created
  },
};
</script>

<style scoped>
.app-container {
  font-family: "Inter", sans-serif;
  background: #f9fbfd;
  min-height: 100vh;
  color: #1f2a44;
}

/* ---------- TOP BAR (same look & behavior) ---------- */
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
  color: #004aad;
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

.progress-circle {
  width: 30px;
  height: 30px;
  background-color: #004aad;
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

/* ---------- RESULTS LAYOUT ---------- */
.results-container {
  max-width: 1120px;
  margin: 30px auto 60px;
  padding: 0 24px;
}

.results-header h1 {
  font-size: 28px;
  color: #24488b;
  margin-bottom: 6px;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 22px;
}

/* Hero row */
.score-hero {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 18px;
  margin-bottom: 20px;
}

.wpm-card {
  background: #ffffff;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.wpm-number {
  font-size: 56px;
  font-weight: 800;
  color: #2e55a2;
  line-height: 1;
}

.wpm-label {
  margin-top: 8px;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-metrics {
  background: #ffffff;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  gap: 14px;
}

.metric .metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #334155;
  font-size: 14px;
  margin-bottom: 8px;
}

.bar {
  width: 100%;
  height: 10px;
  background: #eef2f9;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #2e55a2;
  border-radius: 999px;
  transition: width 300ms ease;
}

.bar-fill.time {
  background: #4f6db9;
}
.bar-fill.error {
  background: #cf4d4d;
}

/* Grid stats */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.stat {
  background: #ffffff;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
  padding: 16px;
}

.stat-label {
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2a44;
}

.stat-value.good {
  color: #2a8f4a;
}

.stat-value.bad {
  color: #cf4d4d;
}

/* Tagline */
.tagline {
  margin: 16px 0 10px;
  color: #42537a;
}

/* Actions */
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 18px;
}

.btn {
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
  padding: 12px 20px;
  transition: transform 0.05s ease, filter 0.1s ease;
}

.btn:active {
  transform: translateY(1px);
}

.btn.primary {
  background: #2e55a2;
  color: #ffffff;
}

.btn.secondary {
  background: #e9eefc;
  color: #2e55a2;
}

.btn.ghost {
  background: #f7f8fc;
  color: #274472;
}

.btn.outline {
  background: #ffffff;
  color: #2e55a2;
  border: 1px solid #d8deeb;
}

/* Responsive */
@media (max-width: 960px) {
  .score-hero {
    grid-template-columns: 1fr;
  }
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .top-bar {
    padding: 0 16px;
  }
}
</style>
