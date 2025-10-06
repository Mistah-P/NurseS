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

    <!-- Centered Main Section -->
    <div class="main-section">
      <!-- Timer and Customize -->
      <div class="timer-section">
        <button class="btn customize-btn" @click="goToCustomize">Customize</button>
        <span class="time-text">Time</span>
        <div class="progress-bar">
          <div class="progress" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>

      <!-- Typing Test -->
      <div
        class="typing-box"
        ref="typingBox"
        tabindex="0"
        @keydown="handleKeyPress"
      >
        <!-- Render by words so words never break; show cursor BEFORE the next letter -->
        <template v-for="(token, tIndex) in tokens" :key="'t-' + tIndex">
          <!-- Word token -->
          <span v-if="token.type === 'word'" class="word">
            <template v-for="letter in token.letters" :key="'l-' + letter.index">
              <span v-if="showCursorAt(letter.index)" class="cursor"></span>
              <span :class="getCharClass(letter.index)">{{ letter.ch }}</span>
            </template>
          </span>

          <!-- Space token (may include multiple spaces/newlines) -->
          <span v-else class="space">
            <template v-for="(ch, sIndex) in token.text.split('')" :key="'s-' + token.start + '-' + sIndex">
              <span v-if="showCursorAt(token.start + sIndex)" class="cursor"></span>{{ ch }}
            </template>
          </span>
        </template>

        <!-- If at end, keep a trailing cursor at the very end while timer runs -->
        <span
          v-if="timeLeft > 0 && typedText.length >= textToType.length"
          class="cursor end-cursor"
        ></span>
      </div>

      <!-- Redo Button -->
      <div class="redo-section">
        <img
          src="@/assets/redo.png"
          alt="Redo"
          class="redo-img"
          tabindex="0"
          ref="redoBtn"
          @click="resetTyping"
          @keydown.enter.prevent="resetTyping"
          title="Redo"
          aria-label="Redo"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default {
  name: "LoggedIn",
  data() {
    return {
      username: "", // Dynamically fetched username
      timeLeft: 30,
      totalTime: 30,
      typedText: "",
      typingStarted: false,
      timer: null,
      correct: 0,
      incorrect: 0,
      textToType:
        "A 12-year old girl with known hyperagglutinability, presented to the emergency department with a 2-week history of headeaches and facial weakness. Neurologic examination indicated sensorineural hearing loss on the right side with Weber's test lateralizing to the left, and the Rinne's test demonstrating bone conduction greater than air conduction on the right. Magnetic resonance imaging of the head revealed severe structural defects of the right petrous temporal bone. No indication of cerebral infarction."
    };
  },
  computed: {
    progressWidth() {
      return (this.timeLeft / this.totalTime) * 100;
    },
    // Build tokens with stable global indices so we can show the cursor BEFORE the next letter,
    // while keeping whole words unbreakable for justified layout.
    tokens() {
      const parts = this.textToType.split(/(\s+)/); // keep spaces as separate tokens
      const tokens = [];
      let idx = 0;

      for (const part of parts) {
        if (part === "") continue;
        const isSpace = /^\s+$/.test(part);

        if (isSpace) {
          tokens.push({
            type: "space",
            text: part,
            start: idx,
            length: part.length,
          });
          idx += part.length;
        } else {
          const letters = Array.from(part).map((ch, i) => ({
            ch,
            index: idx + i,
          }));
          tokens.push({
            type: "word",
            text: part,
            start: idx,
            length: part.length,
            letters,
          });
          idx += part.length;
        }
      }

      return tokens;
    },
  },
  methods: {
    async fetchUsername() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const db = getFirestore();
        const userDoc = doc(db, "users", user.uid);
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

    showCursorAt(globalIndex) {
      return (
        this.timeLeft > 0 &&
        globalIndex === this.typedText.length &&
        this.typedText.length < this.textToType.length
      );
    },

    handleKeyPress(e) {
      if (this.timeLeft <= 0) return;

      if (e.key === "Tab") {
        e.preventDefault();
        this.$refs.redoBtn?.focus();
        return;
      }

      if (!this.typingStarted) {
        this.typingStarted = true;
        this.startTimer();
      }

      if (e.key === "Backspace") {
        if (this.typedText.length > 0) {
          // Adjust accuracy counts when deleting last char
          const lastIndex = this.typedText.length - 1;
          const lastCharTyped = this.typedText[lastIndex];
          if (this.textToType[lastIndex] === lastCharTyped) {
            this.correct = Math.max(0, this.correct - 1);
          } else {
            this.incorrect = Math.max(0, this.incorrect - 1);
          }
          this.typedText = this.typedText.slice(0, -1);
        }
        return;
      }

      if (e.key.length === 1) {
        // normalize single key presses (includes space)
        this.typedText += e.key;

        // Track correctness as user types
        const currentIndex = this.typedText.length - 1;
        if (this.textToType[currentIndex] === e.key) {
          this.correct++;
        } else {
          this.incorrect++;
        }
      }
    },

    getCharClass(index) {
      if (index < this.typedText.length) {
        return this.typedText[index] === this.textToType[index]
          ? "correct"
          : "incorrect";
      } else {
        return "pending";
      }
    },

    startTimer() {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer);
          this.finishTest();
        }
      }, 1000);
    },

    resetTyping() {
      clearInterval(this.timer);
      this.timeLeft = this.totalTime;
      this.typedText = "";
      this.correct = 0;
      this.incorrect = 0;
      this.typingStarted = false;
      // focus back for smooth retry
      this.$nextTick(() => this.$refs.typingBox?.focus());
    },

    finishTest() {
      const elapsed = this.totalTime;
      const wordsTyped = this.typedText.trim().split(/\s+/).filter(Boolean).length;
      const wpm = Math.round((wordsTyped / elapsed) * 60);
      const totalChars = this.typedText.length;
      const accuracy = totalChars > 0 ? Math.round((this.correct / totalChars) * 100) : 0;

      this.$router.push({
        path: "/results",
        query: {
          wpm,
          accuracy,
          time: elapsed,
          correct: this.correct,
          incorrect: this.incorrect,
          backspaces: 0
        }
      });
    },

    goToSettings() { this.$router.push("/settings"); },
    goToHome() { this.$router.push("/loggedin"); },
    goToUserPage() { this.$router.push("/user"); },
    goToHighscore() { this.$router.push("/highscore"); },
    goToAbout() { this.$router.push("/aboutns"); },
    goToCustomize() { this.$router.push("/customize"); }
  },
  async mounted() {
    await this.fetchUsername();
    // Focus the typing area so the fake cursor shows immediately
    this.$nextTick(() => this.$refs.typingBox?.focus());
  },
  beforeUnmount() {
    clearInterval(this.timer);
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
  padding:  0px 215px;
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

/* Centered Section */
.main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 50px;
  margin-top: 100px;
}

/* Timer Section */
.timer-section {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 70%;
}

.customize-btn {
  color: white;
  background: #2D539E;
  padding: 6px 12px;
}

.time-text {
  font-weight: 500;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #2D539E;
  transition: width 0.3s linear;
}

/* Typing Box */
.typing-box {
  width: 70%;
  min-height: 150px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #ddd;
  font-size: 28px;
  line-height: 1.5;
  outline: none;
  cursor: text;
  user-select: none;

  /* Keep the justified look without cutting words in half */
  text-align: justify;
  word-break: normal;       /* do not break within words */
  overflow-wrap: normal;    /* break only at spaces */
  hyphens: none;
}

/* Keep each word unbreakable so justification only expands spaces */
.word {
  display: inline-block;
  white-space: nowrap;
}

.pending {
  color: #bbb;
}

.correct {
  color: black;
}

.incorrect {
  color: red;
}

/* Cursor shown BEFORE the next character */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: black;
  margin-right: 1px;   /* space between cursor and the upcoming letter */
  animation: blink 1s infinite;
  vertical-align: text-bottom;
}

/* end-of-text cursor aligns nicely at the end */
.end-cursor {
  margin-left: 1px;
  margin-right: 0;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

/* Redo Section */
.redo-section {
  margin-top: 5px;
}

.redo-img {
  height: 34px;
  cursor: pointer;
  outline: none;
}

.redo-img:focus {
  outline: 3px solid #2D539E;
  border-radius: 6px;
}
</style>
