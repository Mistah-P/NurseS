<template>
  <div class="landing-container">
    <!-- Animated Background -->
    <div class="animated-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
        <div class="shape shape-6"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- Navigation Header -->
    <header class="modern-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <i class="fas fa-heartbeat"></i>
          </div>
          <span class="logo-text">NurseScript</span>
        </div>
        <nav class="header-nav">
          <a href="#features" class="nav-link">Features</a>
          <button class="login-btn" @click="goToLogin">
            <i class="fas fa-sign-in-alt"></i>
            Sign In
          </button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="title-line">Master Medical</span>
            <span class="title-line highlight">Typing Skills</span>
            <span class="title-line">for Healthcare</span>
          </h1>
          <p class="hero-subtitle">
            Professional typing practice designed specifically for nursing students and healthcare professionals. 
            Improve your speed, accuracy, and medical terminology knowledge.
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">50K+</div>
              <div class="stat-label">Students</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">95%</div>
              <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Available</div>
            </div>
          </div>
          <div class="hero-actions">
            <button class="cta-primary" @click="startDemo">
              <span>Start Typing Now</span>
              <i class="fas fa-play"></i>
            </button>
            <button class="cta-secondary" @click="goToLogin">
              <i class="fas fa-sign-in-alt"></i>
              Sign In
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="typing-demo-container">
            <div class="demo-header">
              <div class="demo-controls">
                <div class="control-dot red"></div>
                <div class="control-dot yellow"></div>
                <div class="control-dot green"></div>
              </div>
              <div class="demo-title">Live Typing Demo</div>
            </div>
            <div class="demo-content">
              <div class="typing-stats">
                <div class="stat">
                  <span class="stat-value">{{ currentWPM }}</span>
                  <span class="stat-unit">WPM</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ currentAccuracy }}%</span>
                  <span class="stat-unit">Accuracy</span>
                </div>
                <div class="progress-ring">
                  <svg class="progress-svg" viewBox="0 0 36 36">
                    <path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="progress-bar" :stroke-dasharray="`${progressWidth}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div class="progress-text">{{ timeLeft }}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Typing Test Section -->
    <section class="typing-section" id="demo">
      <div class="section-header">
        <h2 class="section-title">Try Our Interactive Demo</h2>
        <p class="section-subtitle">Experience the power of medical-focused typing practice</p>
      </div>
      
      <div class="typing-container">
        <div class="typing-controls">
          <div class="control-group">
            <button class="control-btn start-btn" @click="focusDemo" v-if="!typingStarted">
              <i class="fas fa-play"></i>
              Start Demo
            </button>
            <button class="control-btn" @click="showWarning" :class="{ disabled: true }">
              <i class="fas fa-cog"></i>
              Customize
            </button>
            <div class="time-display">
              <i class="fas fa-clock"></i>
              <span>{{ timeLeft }}s</span>
            </div>
          </div>
          <div class="progress-container">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="typing-box-container">
          <div
            class="modern-typing-box"
            ref="typingBox"
            tabindex="0"
            @keydown="handleKeyPress"
            @focus="onFocus"
            @blur="onBlur"
          >
            <div class="typing-content">
              <template v-for="(token, tIndex) in tokens" :key="'t-' + tIndex">
                <span v-if="token.type === 'word'" class="word">
                  <template v-for="letter in token.letters" :key="'l-' + letter.index">
                    <span v-if="showCursorAt(letter.index)" class="modern-cursor"></span>
                    <span :class="getCharClass(letter.index)">{{ letter.ch }}</span>
                  </template>
                </span>
                <span v-else class="space">
                  <template v-for="(ch, sIndex) in token.text.split('')" :key="'s-' + token.start + '-' + sIndex">
                    <span v-if="showCursorAt(token.start + sIndex)" class="modern-cursor"></span>{{ ch }}
                  </template>
                </span>
              </template>
              <span
                v-if="timeLeft > 0 && typedText.length >= textToType.length"
                class="modern-cursor end-cursor"
              ></span>
            </div>
          </div>
          
          <div class="typing-actions">
            <button class="action-btn reset-btn" @click="resetTyping">
              <i class="fas fa-redo"></i>
              Reset
            </button>
            <div class="typing-info">
              <span class="info-text">{{ typedText.length }}/{{ textToType.length }} characters</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning Message -->
      <transition name="slide-up">
        <div v-if="warningVisible" class="warning-card">
          <div class="warning-icon">
            <i class="fas fa-lock"></i>
          </div>
          <div class="warning-content">
            <h4>Premium Feature</h4>
            <p>Please sign in to access customization options and save your progress.</p>
          </div>
          <button class="warning-action" @click="goToLogin">
            Sign In Now
          </button>
        </div>
      </transition>
    </section>

    <!-- Features Section -->
    <section class="features-section" id="features">
      <div class="features-container">
        <div class="section-header">
          <h2 class="section-title">Why Choose NurseScript?</h2>
          <p class="section-subtitle">Designed specifically for healthcare professionals</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card" v-for="(feature, index) in features" :key="index">
            <div class="feature-icon">
              <i :class="feature.icon"></i>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Improve Your Medical Typing?</h2>
          <p class="cta-subtitle">Join thousands of healthcare professionals who trust NurseScript</p>
          <div class="cta-actions">
            <button class="cta-primary large" @click="goToLogin">
              <span>Get Started Free</span>
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo Modal -->
    <transition name="modal-fade">
      <div v-if="showDemoModal" class="modal-overlay" @click="closeDemoModal">
        <div class="demo-modal" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Interactive Typing Demo</h2>
            <button class="modal-close" @click="closeDemoModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="typing-container">
              <div class="typing-controls">
                <div class="control-group">
                  <button class="control-btn start-btn" @click="$refs.modalTypingBox?.focus()" v-if="!typingStarted">
                    <i class="fas fa-play"></i>
                    Start Demo
                  </button>
                  <div class="time-display">
                    <i class="fas fa-clock"></i>
                    <span>{{ timeLeft }}s</span>
                  </div>
                </div>
                <div class="progress-container">
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
                  </div>
                </div>
              </div>

              <div class="typing-box-container">
                <div
                  class="modern-typing-box"
                  ref="modalTypingBox"
                  tabindex="0"
                  @keydown="handleKeyPress"
                  @focus="onFocus"
                  @blur="onBlur"
                >
                  <div class="typing-content">
                    <template v-for="(token, tIndex) in tokens" :key="'t-' + tIndex">
                      <span v-if="token.type === 'word'" class="word">
                        <template v-for="letter in token.letters" :key="'l-' + letter.index">
                          <span v-if="showCursorAt(letter.index)" class="modern-cursor"></span>
                          <span :class="getCharClass(letter.index)">{{ letter.ch }}</span>
                        </template>
                      </span>
                      <span v-else class="space">
                        <template v-for="(ch, sIndex) in token.text.split('')" :key="'s-' + token.start + '-' + sIndex">
                          <span v-if="showCursorAt(token.start + sIndex)" class="modern-cursor"></span>{{ ch }}
                        </template>
                      </span>
                    </template>
                    <span
                      v-if="timeLeft > 0 && typedText.length >= textToType.length"
                      class="modern-cursor end-cursor"
                    ></span>
                  </div>
                </div>
                
                <div class="typing-actions">
                  <button class="action-btn reset-btn" @click="resetTyping">
                    <i class="fas fa-redo"></i>
                    Reset
                  </button>
                  <div class="typing-info">
                    <span class="info-text">{{ typedText.length }}/{{ textToType.length }} characters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
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
      isFocused: false,
      currentWPM: 0,
      currentAccuracy: 100,
      showDemoModal: false,
      textToType: "NurseScript is a specialized typing platform designed for nursing students and healthcare professionals. Our system focuses on medical terminology, patient documentation, and clinical scenarios that nurses encounter daily. By practicing with real-world healthcare content, students develop both typing speed and medical vocabulary simultaneously.",
      features: [
        {
          icon: "fas fa-user-md",
          title: "Medical Focus",
          description: "Practice with real medical terminology and clinical scenarios used in healthcare settings."
        },
        {
          icon: "fas fa-chart-line",
          title: "Progress Tracking",
          description: "Monitor your improvement with detailed analytics and performance metrics."
        },
        {
          icon: "fas fa-users",
          title: "Collaborative Learning",
          description: "Join live sessions with classmates and compete in real-time typing challenges."
        },
        {
          icon: "fas fa-certificate",
          title: "Professional Ready",
          description: "Build skills that directly translate to efficient patient documentation."
        },
        {
          icon: "fas fa-clock",
          title: "Flexible Practice",
          description: "Practice anytime with customizable sessions that fit your schedule."
        },
        {
          icon: "fas fa-shield-alt",
          title: "Secure Platform",
          description: "HIPAA-compliant environment ensuring your practice data stays protected."
        }
      ]
    };
  },
  computed: {
    progressWidth() {
      return (this.timeLeft / this.totalTime) * 100;
    },
    tokens() {
      const parts = this.textToType.split(/(\s+)/);
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
        return;
      }

      if (!this.typingStarted) {
        this.typingStarted = true;
        this.startTimer();
      }

      if (e.key === "Backspace") {
        this.typedText = this.typedText.slice(0, -1);
        this.updateStats();
        return;
      }

      if (e.key.length === 1) {
        this.typedText += e.key;
        this.updateStats();
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

    updateStats() {
      if (this.typedText.length > 0) {
        const timeElapsed = (this.totalTime - this.timeLeft) / 60;
        const wordsTyped = this.typedText.length / 5;
        this.currentWPM = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        
        let correctChars = 0;
        for (let i = 0; i < this.typedText.length; i++) {
          if (this.typedText[i] === this.textToType[i]) {
            correctChars++;
          }
        }
        this.currentAccuracy = Math.round((correctChars / this.typedText.length) * 100);
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
      this.currentWPM = 0;
      this.currentAccuracy = 100;
      this.$nextTick(() => this.$refs.typingBox?.focus());
    },

    onFocus() {
      this.isFocused = true;
    },

    onBlur() {
      this.isFocused = false;
    },

    goToLogin() {
      this.$router.push("/login");
    },

    startDemo() {
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        this.$refs.typingBox?.focus();
      }, 500);
    },

    focusDemo() {
      this.showDemoModal = true;
      this.$nextTick(() => {
        this.$refs.modalTypingBox?.focus();
      });
    },

    closeDemoModal() {
      this.showDemoModal = false;
      this.resetTyping();
    },

    showWarning() {
      this.warningVisible = true;
      setTimeout(() => {
        this.warningVisible = false;
      }, 5000);
    }
  },
  mounted() {
    this.$nextTick(() => this.$refs.typingBox?.focus());
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
/* Import fonts and icons */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.landing-container {
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* Animated Background */
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-color);
  opacity: 0.1;
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: -5s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 20%;
  animation-delay: -10s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 30%;
  animation-delay: -15s;
}

.shape-5 {
  width: 140px;
  height: 140px;
  top: 40%;
  left: 60%;
  animation-delay: -7s;
}

.shape-6 {
  width: 90px;
  height: 90px;
  top: 70%;
  right: 40%;
  animation-delay: -12s;
}

@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 20%, var(--accent-color-alpha) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, var(--accent-color-alpha) 0%, transparent 50%);
  z-index: -1;
}

/* Modern Header */
.modern-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-badge {
  background: var(--accent-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.login-btn {
  background: var(--accent-gradient);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

/* Hero Section */
.hero-section {
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.title-line {
  animation: slideInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

.title-line:nth-child(1) { animation-delay: 0.1s; }
.title-line:nth-child(2) { animation-delay: 0.3s; }
.title-line:nth-child(3) { animation-delay: 0.5s; }

.highlight {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  animation: slideInUp 0.8s ease-out 0.7s forwards;
  opacity: 0;
  transform: translateY(30px);
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2.5rem;
  animation: slideInUp 0.8s ease-out 0.9s forwards;
  opacity: 0;
  transform: translateY(30px);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  display: block;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  animation: slideInUp 0.8s ease-out 1.1s forwards;
  opacity: 0;
  transform: translateY(30px);
}

.cta-primary {
  background: var(--accent-gradient);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px var(--accent-color-alpha);
}

.cta-primary.large {
  padding: 1.25rem 2.5rem;
  font-size: 1.2rem;
}

.cta-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cta-secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: translateY(-2px);
}

/* Hero Visual */
.hero-visual {
  animation: slideInRight 1s ease-out 0.5s forwards;
  opacity: 0;
  transform: translateX(50px);
}

.typing-demo-container {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px var(--shadow-dark);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.demo-controls {
  display: flex;
  gap: 0.5rem;
}

.control-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.control-dot.red { background: #ff5f57; }
.control-dot.yellow { background: #ffbd2e; }
.control-dot.green { background: #28ca42; }

.demo-title {
  font-weight: 600;
  color: var(--text-secondary);
}

.typing-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  display: block;
}

.stat-unit {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: var(--bg-tertiary);
  stroke-width: 3;
}

.progress-bar {
  fill: none;
  stroke: var(--accent-color);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  color: var(--text-primary);
}

/* Typing Section */
.typing-section {
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.typing-container {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px var(--shadow-dark);
}

.typing-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn:hover:not(.disabled) {
  background: var(--bg-secondary);
  border-color: var(--accent-color);
}

.control-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.control-btn.start-btn {
  background: var(--accent-gradient);
  border: 1px solid var(--accent-color);
  color: white;
  font-weight: 600;
}

.control-btn.start-btn:hover {
  background: var(--accent-gradient);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-container {
  flex: 1;
  margin-left: 2rem;
}

.progress-track {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.typing-box-container {
  margin-bottom: 1rem;
}

.modern-typing-box {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  min-height: 200px;
  font-size: 1.2rem;
  line-height: 1.8;
  outline: none;
  cursor: text;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.modern-typing-box:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-alpha);
}

.typing-content {
  text-align: left;
  word-break: normal;
  overflow-wrap: normal;
  hyphens: none;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.word {
  display: inline;
  white-space: pre;
}

.pending {
  color: var(--text-tertiary);
}

.correct {
  color: var(--success-color);
  background: rgba(72, 187, 120, 0.1);
  border-radius: 3px;
}

.incorrect {
  color: var(--error-color);
  background: rgba(245, 101, 101, 0.1);
  border-radius: 3px;
}

.modern-cursor {
  display: inline;
  width: 2px;
  height: 1.4em;
  background: var(--accent-color);
  animation: modernBlink 1.2s infinite;
  vertical-align: text-bottom;
  border-radius: 1px;
  position: relative;
}

.end-cursor {
  margin-left: 2px;
  margin-right: 0;
}

@keyframes modernBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.typing-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.action-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-2px);
}

.typing-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Warning Card */
.warning-card {
  background: var(--bg-secondary);
  border: 1px solid var(--warning-color);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.1);
}

.warning-icon {
  width: 60px;
  height: 60px;
  background: var(--warning-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.warning-content h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.warning-content p {
  color: var(--text-secondary);
  margin: 0;
}

.warning-action {
  background: var(--warning-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.warning-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

/* Features Section */
.features-section {
  padding: 4rem 2rem;
  background: var(--bg-secondary);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px var(--shadow-dark);
  border-color: var(--accent-color);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: var(--accent-gradient);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  font-size: 2rem;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  padding: 4rem 2rem;
  background: var(--accent-gradient);
  color: white;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.cta-actions {
  display: flex;
  justify-content: center;
}

.cta-primary.large {
  background: white;
  color: #2d3748;
  font-weight: 600;
}

.cta-primary.large:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

/* Animations */
@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.3s ease-in;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .typing-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .progress-container {
    margin-left: 0;
  }

  .warning-card {
    flex-direction: column;
    text-align: center;
  }

  .header-content {
    padding: 1rem;
  }

  .header-nav {
    gap: 1rem;
  }

  .nav-link {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .modern-typing-box {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.demo-modal {
  background: var(--card-background);
  border-radius: 20px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.modal-close:hover {
  background: var(--hover-background);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.modal-content {
  padding: 2rem;
}

/* Modal Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .demo-modal,
.modal-fade-leave-to .demo-modal {
  transform: scale(0.9) translateY(-20px);
}

.modal-fade-enter-active .demo-modal,
.modal-fade-leave-active .demo-modal {
  transition: transform 0.3s ease;
}

/* Responsive Modal */
@media (max-width: 768px) {
  .demo-modal {
    width: 95%;
    margin: 1rem;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-title {
    font-size: 1.3rem;
  }
}
</style>
