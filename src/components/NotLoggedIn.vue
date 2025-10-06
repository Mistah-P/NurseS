<template>
  <div class="app-container">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="left-section">
        <span class="logo">NurseScripts</span>
      </div>
      <div class="right-section">
        <button class="btn login-btn" @click="goToLogin">Log In</button>
      </div>
    </header>

    <!-- Centered Main Section -->
    <div class="main-section">
      <!-- Timer and Customize -->
      <div class="timer-section">
        <button class="btn customize-btn" @click="showWarning">Customize</button>
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
        <!-- Render by words/spaces so words never break; cursor appears BEFORE the next letter -->
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

      <!-- Warning Message -->
      <transition name="fade">
        <div v-if="warningVisible" class="warning-message">
          Please login to use the customize menu and save your progress.
        </div>
      </transition>

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
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotLoggedIn",
  data() {
    return {
      timeLeft: 30,
      totalTime: 30,
      typedText: "",
      typingStarted: false,
      timer: null,
      warningVisible: false,
      textToType:
        "NurseScripts is a typing test website designed specifically for nursing students to improve both their typing speed and medical terminology skills. Unlike regular typing platforms that use random words, NurseScripts focuses on real-world clinical scenarios, patient cases, and medical vocabulary that nurses encounter in their daily work. By practicing here, students not only become faster and more accurate typists but also gain confidence in documenting patient information, writing orders, and handling critical records. This makes the practice directly relevant to their profession and more beneficial than other typing test sites. With NurseScripts, nursing students can build efficiency, accuracy, and confidence—skills that carry over into real-world healthcare settings where precision and speed truly matter."
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
        this.$refs.redoBtn && this.$refs.redoBtn.focus();
        return;
      }

      if (!this.typingStarted) {
        this.typingStarted = true;
        this.startTimer();
      }

      if (e.key === "Backspace") {
        this.typedText = this.typedText.slice(0, -1);
        return;
      }

      if (e.key.length === 1) {
        // includes space
        this.typedText += e.key;
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
        }
      }, 1000);
    },

    resetTyping() {
      clearInterval(this.timer);
      this.timeLeft = this.totalTime;
      this.typedText = "";
      this.typingStarted = false;
      this.$nextTick(() => this.$refs.typingBox?.focus());
    },

    goToLogin() {
      this.$router.push("/login");
    },

    showWarning() {
      this.warningVisible = true;
      setTimeout(() => {
        this.warningVisible = false;
      }, 3000);
    }
  },
  mounted() {
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
  gap: 12px;
}

.btn {
  background: #2D539E;
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

.main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 25px;
  margin-top: 100px;
}

.timer-section {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 70%;
}

.customize-btn {
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

.typing-box {
  width: 70%;
  min-height: 150px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #ddd;
  font-size: 21px;
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

.space {
  /* spaces justify naturally */
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
  margin-right: 1px; /* BEFORE upcoming letter */
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

/* Warning Message */
.warning-message {
  color: #d9534f;
  font-weight: 500;
  margin-top: 10px;
  background: #f8d7da;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
}

/* Fade transition for warning */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
