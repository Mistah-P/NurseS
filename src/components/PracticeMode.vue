<template>
  <div class="practice-mode">
    <!-- Main Content -->
    <main class="main-content">

      <!-- Practice Mode Content -->
      <div class="practice-content">

        <!-- Setup Section -->
        <div class="setup-section" v-if="!isTyping">
      <div class="setup-container">
        <!-- Mode Selection -->
        <div class="selection-card mode-selection">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Select Mode
          </h3>
          <div class="mode-options">
            <div 
              class="mode-option" 
              :class="{ active: selectedMode === 'time' }"
              @click="selectMode('time')"
            >
              <div class="mode-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="mode-info">
                <h4>Time Mode</h4>
                <p>Practice for a specific duration</p>
              </div>
            </div>
            <div 
              class="mode-option" 
              :class="{ active: selectedMode === 'words' }"
              @click="selectMode('words')"
            >
              <div class="mode-icon">
                <i class="fas fa-font"></i>
              </div>
              <div class="mode-info">
                <h4>Words Mode</h4>
                <p>Practice a specific number of words</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Duration/Words Selection -->
        <div class="selection-card duration-selection" v-if="selectedMode">
          <h3 class="card-title">
            <i class="fas fa-sliders-h"></i>
            {{ selectedMode === 'time' ? 'Select Duration' : 'Select Word Count' }}
          </h3>
          <div class="duration-options">
            <div 
              v-for="option in currentOptions" 
              :key="option.value"
              class="duration-option"
              :class="{ active: selectedDuration === option.value }"
              @click="selectDuration(option.value)"
            >
              <span class="duration-value">{{ option.label }}</span>
            </div>
          </div>
          
          <!-- Custom Input Section -->
          <div v-if="selectedDuration === 'custom'" class="custom-input-section">
            <div class="custom-input-container">
              <label class="custom-label">
                {{ selectedMode === 'time' ? 'Enter duration (seconds):' : 'Enter word count:' }}
              </label>
              <input 
                type="number" 
                :value="selectedMode === 'time' ? customTimeValue : customWordValue"
                @input="updateCustomValue"
                :min="selectedMode === 'time' ? 30 : 10"
                :max="selectedMode === 'time' ? 3600 : 1000"
                class="custom-input"
                :placeholder="selectedMode === 'time' ? 'e.g., 120' : 'e.g., 75'"
              />
              <span class="custom-hint">
                {{ selectedMode === 'time' ? '(30-3600 seconds)' : '(10-1000 words)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Topic Selection -->
        <div class="selection-card topic-selection" v-if="selectedMode && selectedDuration">
          <h3 class="card-title">
            <i class="fas fa-book-medical"></i>
            Select Topic
          </h3>
          <div class="topic-options">
            <div 
              v-for="topic in topics" 
              :key="topic.id"
              class="topic-option"
              :class="{ active: selectedTopic === topic.id }"
              @click="selectTopic(topic.id)"
            >
              <div class="topic-icon">
                <i :class="topic.icon"></i>
              </div>
              <div class="topic-info">
                <h4>{{ topic.name }}</h4>
                <p>{{ topic.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <div class="start-section" v-if="selectedMode && selectedDuration && selectedTopic">
          <button class="start-btn" @click="startPractice">
            <i class="fas fa-play"></i>
            Start Practice
          </button>
        </div>
      </div>
    </div> <!-- End setup-section -->

        <!-- Typing Section -->
        <div class="typing-section" v-if="isTyping">
      <div class="typing-header">
        <div class="typing-stats">
          <div class="stat-item">
            <span class="stat-label">{{ selectedMode === 'time' ? 'Time' : 'Words' }}</span>
            <span class="stat-value">{{ currentProgress }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">WPM</span>
            <span class="stat-value">{{ wpm }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">{{ accuracy }}%</span>
          </div>
        </div>
        <button class="stop-btn" @click="stopPractice">
          <i class="fas fa-stop"></i>
          Stop
        </button>
      </div>

      <div class="typing-area">
        <div 
          class="text-display"
          tabindex="0"
          @keydown="handleKeydown"
          @focus="handleFocus"
          ref="textDisplay"
        >
          <span 
            v-for="(char, index) in displayText" 
            :key="index"
            :class="getCharClass(index)"
          >
            {{ char }}
          </span>
        </div>
      </div>
      </div>

      </div> <!-- End practice-content -->
    </main>

    <!-- Completion Modal -->
    <div v-if="showCompletionModal" class="completion-modal-overlay" @click="closeModal">
      <div class="completion-modal" @click.stop>
        <div class="modal-header">
          <h2>🎉 Practice Completed!</h2>
        </div>
        <div class="modal-body">
          <div class="final-stats">
            <div class="final-stat">
              <div class="final-stat-value">{{ finalWPM }}</div>
              <div class="final-stat-label">WPM</div>
            </div>
            <div class="final-stat">
              <div class="final-stat-value">{{ finalAccuracy }}%</div>
              <div class="final-stat-label">Accuracy</div>
            </div>
            <div class="final-stat">
              <div class="final-stat-value">{{ formatDuration(practiceTime) }}</div>
              <div class="final-stat-label">Time Practiced</div>
            </div>
          </div>
          <div class="performance-message">
            <p>{{ getPerformanceMessage() }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="startNewPractice" class="new-practice-btn">
            <i class="fas fa-redo"></i>
            Practice Again
          </button>
          <button @click="closeModal" class="close-modal-btn">
            <i class="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import typingResultsService from '../services/typingResultsService'

export default {
  name: 'PracticeMode',
  data() {
    return {
      sidebarCollapsed: false,
      selectedMode: null,
      selectedDuration: null,
      selectedTopic: null,
      isTyping: false,
      userInput: '',
      displayText: '',
      currentProgress: '',
      wpm: 0,
      accuracy: 100,
      startTime: null,
      typedCharacters: 0,
      correctCharacters: 0,
      // Modal-related properties
      showCompletionModal: false,
      finalWPM: 0,
      finalAccuracy: 0,
      practiceTime: 0,
      // Timer reference to prevent multiple timers
      timerInterval: null,
      timeOptions: [
        { value: 60, label: '1 minute' },
        { value: 180, label: '3 minutes' },
        { value: 300, label: '5 minutes' },
        { value: 600, label: '10 minutes' },
        { value: 'custom', label: 'Custom' }
      ],
      wordOptions: [
        { value: 25, label: '25 words' },
        { value: 50, label: '50 words' },
        { value: 100, label: '100 words' },
        { value: 200, label: '200 words' },
        { value: 'custom', label: 'Custom' }
      ],
      customTimeValue: 60,
      customWordValue: 50,
      topics: [], // Will be populated with dummy nursing topics
      sampleTexts: {} // Will be populated with dummy nursing content
    }
  },
  async mounted() {
    // Create dummy nursing topics (separate from main modules)
    this.topics = [
      {
        id: 'vital-signs',
        name: 'Vital Signs',
        description: 'Practice typing vital signs terminology and procedures',
        icon: 'fas fa-heartbeat'
      },
      {
        id: 'medication-admin',
        name: 'Medication Administration',
        description: 'Practice typing medication names and administration procedures',
        icon: 'fas fa-pills'
      },
      {
        id: 'patient-assessment',
        name: 'Patient Assessment',
        description: 'Practice typing patient assessment terminology',
        icon: 'fas fa-stethoscope'
      },
      {
        id: 'wound-care',
        name: 'Wound Care',
        description: 'Practice typing wound care procedures and terminology',
        icon: 'fas fa-band-aid'
      },
      {
        id: 'infection-control',
        name: 'Infection Control',
        description: 'Practice typing infection control protocols',
        icon: 'fas fa-shield-virus'
      },
      {
        id: 'emergency-procedures',
        name: 'Emergency Procedures',
        description: 'Practice typing emergency response procedures',
        icon: 'fas fa-ambulance'
      }
    ];
    
    // Create dummy nursing content for each topic
    this.sampleTexts = {
      'vital-signs': 'Blood pressure measurement requires proper cuff size selection and patient positioning. Normal adult blood pressure ranges from 90/60 to 120/80 mmHg. Temperature can be measured orally, rectally, axillary, or tympanically. Normal oral temperature is 98.6°F or 37°C. Pulse rate for adults ranges from 60 to 100 beats per minute. Respiratory rate for adults is typically 12 to 20 breaths per minute. Oxygen saturation should be above 95% in healthy individuals.',
      
      'medication-admin': 'The five rights of medication administration include right patient, right medication, right dose, right route, and right time. Always verify patient identity using two identifiers before administering medications. Check medication labels three times: when removing from storage, when preparing, and before administration. Document medication administration immediately after giving the medication. Monitor for adverse reactions and therapeutic effects. Never leave medications unattended at the bedside.',
      
      'patient-assessment': 'Head-to-toe assessment begins with general appearance and vital signs. Inspect the head for symmetry, lesions, and hair distribution. Examine eyes for pupil response, visual acuity, and conjunctival color. Assess ears for hearing, discharge, and cerumen. Inspect mouth and throat for lesions, dental hygiene, and swallowing ability. Palpate neck for lymph nodes, thyroid, and carotid pulses. Auscultate heart sounds and lung sounds systematically.',
      
      'wound-care': 'Wound assessment includes measuring length, width, and depth. Document wound appearance, drainage characteristics, and surrounding skin condition. Clean wounds using sterile technique from clean to dirty areas. Apply appropriate dressings based on wound type and drainage amount. Monitor for signs of infection including increased pain, redness, warmth, swelling, and purulent drainage. Change dressings according to physician orders and facility protocols.',
      
      'infection-control': 'Hand hygiene is the most important measure to prevent healthcare-associated infections. Use alcohol-based hand sanitizer or soap and water for at least 20 seconds. Wear personal protective equipment including gloves, gowns, masks, and eye protection as indicated. Follow standard precautions for all patients regardless of diagnosis. Implement transmission-based precautions for contact, droplet, or airborne infections. Properly dispose of contaminated materials in appropriate containers.',
      
      'emergency-procedures': 'Cardiopulmonary resuscitation begins with checking responsiveness and breathing. Call for help and activate emergency response system immediately. Position patient on firm surface and begin chest compressions at least 2 inches deep at 100-120 compressions per minute. Provide rescue breaths using bag-mask ventilation if trained. Continue CPR until advanced life support arrives or patient regains pulse. Document all interventions and patient responses during emergency situations.'
    };
  },
  computed: {
    currentOptions() {
      return this.selectedMode === 'time' ? this.timeOptions : this.wordOptions;
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    logout() {
      this.$router.push('/login');
    },
    selectMode(mode) {
      this.selectedMode = mode;
      this.selectedDuration = null;
      this.selectedTopic = null;
    },
    selectDuration(duration) {
      this.selectedDuration = duration;
      // Reset topic selection when duration changes
      this.selectedTopic = null;
    },
    updateCustomValue(event) {
      const value = parseInt(event.target.value);
      if (this.selectedMode === 'time') {
        this.customTimeValue = Math.max(30, Math.min(3600, value || 30));
      } else {
        this.customWordValue = Math.max(10, Math.min(1000, value || 10));
      }
    },
    selectTopic(topic) {
      this.selectedTopic = topic;
    },
    startPractice() {
      this.isTyping = true;
      this.userInput = '';
      this.displayText = this.sampleTexts[this.selectedTopic];
      this.startTime = Date.now();
      this.typedCharacters = 0;
      this.correctCharacters = 0;
      
      this.$nextTick(() => {
        this.$refs.textDisplay.focus();
      });
  
      if (this.selectedMode === 'time') {
        this.startTimer();
      }
    },
    async stopPractice() {
      // Clear timer if running
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      
      // Capture final stats before stopping
      if (this.isTyping && this.startTime) {
        this.finalWPM = this.wpm;
        this.finalAccuracy = this.accuracy;
        this.practiceTime = (Date.now() - this.startTime) / 1000; // in seconds
        
        try {
          const duration = this.practiceTime;
          const wordsTyped = this.userInput.trim().split(/\s+/).filter(word => word.length > 0).length;
          const errorsCount = this.typedCharacters - this.correctCharacters;
          
          await typingResultsService.savePracticeResult({
            wpm: this.wpm,
            accuracy: this.accuracy,
            duration: duration,
            wordsTyped: wordsTyped,
            errorsCount: errorsCount,
            topic: this.selectedTopic,
            difficulty: 'Medium',
            textLength: this.displayText ? this.displayText.length : 1,
            mode: this.selectedMode,
            target: this.selectedDuration === 'custom' ? 
              (this.selectedMode === 'time' ? this.customTimeValue : this.customWordValue) : 
              this.selectedDuration,
            completedAt: new Date().toISOString()
          }
          );
          console.log('✅ Practice typing results saved to database');
        } catch (error) {
          console.error('❌ Error saving practice typing results:', error);
          // Don't show error to user to avoid disrupting the experience
        }
        
        // Show completion modal
        this.showCompletionModal = true;
      }
      
      this.isTyping = false;
    },
    startTimer() {
      // Clear any existing timer first
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      // Get the actual duration value (custom or preset)
      const actualDuration = this.selectedDuration === 'custom' ? this.customTimeValue : this.selectedDuration;
      
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const remaining = actualDuration - elapsed;
        
        if (remaining <= 0) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
          this.stopPractice();
          return;
        }
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        this.currentProgress = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }, 1000);
    },
    handleInput() {
      this.typedCharacters = this.userInput.length;
      this.correctCharacters = 0;
      
      for (let i = 0; i < this.userInput.length; i++) {
        if (this.userInput[i] === this.displayText[i]) {
          this.correctCharacters++;
        }
      }
      
      this.calculateWPM();
      this.calculateAccuracy();
      
      if (this.selectedMode === 'words') {
        // Count only complete words that match the target text
        const correctWordsTyped = this.getCorrectWordsCount();
        const targetWords = this.selectedDuration === 'custom' ? this.customWordValue : this.selectedDuration;
        this.currentProgress = `${correctWordsTyped}/${targetWords}`;
        
        if (correctWordsTyped >= targetWords) {
          this.stopPractice();
        }
      }
    },
    handleKeydown(event) {
      // Prevent default behavior for most keys
      if (event.key.length === 1 || event.key === 'Backspace') {
        event.preventDefault();
        
        if (event.key === 'Backspace') {
          // Handle backspace
          if (this.userInput.length > 0) {
            this.userInput = this.userInput.slice(0, -1);
            this.handleInput();
          }
        } else {
          // Handle regular character input
          this.userInput += event.key;
          this.handleInput();
        }
      }
    },
    handleFocus() {
      // Keep focus on the text display area
      if (this.isTyping) {
        this.$refs.textDisplay.focus();
      }
    },
    calculateWPM() {
      if (!this.startTime) return;
      
      const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
      if (timeElapsed < 0.01) { // Prevent division by very small numbers
        this.wpm = 0;
        return;
      }
      
      // Calculate based on correct words typed (more accurate)
      const correctWords = this.getCorrectWordsCount();
      this.wpm = Math.round(correctWords / timeElapsed) || 0;
    },
    calculateAccuracy() {
      if (this.typedCharacters === 0) {
        this.accuracy = 100;
        return;
      }
      
      // More precise accuracy calculation
      let correctChars = 0;
      const inputLength = Math.min(this.userInput.length, this.displayText.length);
      
      for (let i = 0; i < inputLength; i++) {
        if (this.userInput[i] === this.displayText[i]) {
          correctChars++;
        }
      }
      
      this.accuracy = Math.round((correctChars / this.userInput.length) * 100);
    },
    getCorrectWordsCount() {
      // Split both texts into words and compare
      const userWords = this.userInput.trim().split(/\s+/).filter(word => word.length > 0);
      const displayWords = this.displayText.trim().split(/\s+/);
      
      let correctWords = 0;
      for (let i = 0; i < userWords.length && i < displayWords.length; i++) {
        if (userWords[i] === displayWords[i]) {
          correctWords++;
        }
      }
      
      return correctWords;
    },
    getCharClass(index) {
      if (index < this.userInput.length) {
        return this.userInput[index] === this.displayText[index] ? 'correct' : 'incorrect';
      } else if (index === this.userInput.length) {
        return 'current';
      }
      return '';
    },
    // Modal-related methods
    closeModal() {
      this.showCompletionModal = false;
      // Reset selections to allow new practice
      this.selectedMode = null;
      this.selectedDuration = null;
      this.selectedTopic = null;
    },
    startNewPractice() {
      this.showCompletionModal = false;
      // Keep current selections and start immediately
      if (this.selectedMode && this.selectedDuration && this.selectedTopic) {
        this.startPractice();
      } else {
        // Reset if selections are missing
        this.selectedMode = null;
        this.selectedDuration = null;
        this.selectedTopic = null;
      }
    },
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    },
    getPerformanceMessage() {
      const wpm = this.finalWPM;
      const accuracy = this.finalAccuracy;
      
      if (wpm >= 60 && accuracy >= 95) {
        return "Excellent work! You're typing like a pro! 🌟";
      } else if (wpm >= 40 && accuracy >= 90) {
        return "Great job! You're making solid progress! 👍";
      } else if (wpm >= 25 && accuracy >= 85) {
        return "Good effort! Keep practicing to improve! 📈";
      } else if (accuracy >= 95) {
        return "Perfect accuracy! Focus on building speed! ⚡";
      } else if (wpm >= 40) {
        return "Good speed! Work on accuracy for better results! 🎯";
      } else {
        return "Keep practicing! Every session makes you better! 💪";
      }
    }
  }
}
</script>

<style scoped>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Dashboard Layout */
.practice-mode {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Page Header */
.page-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.logo-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.student-badge {
  display: inline-block;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title i {
  color: #48bb78;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-nav {
  display: flex;
  gap: 1rem;
  background: rgba(74, 85, 104, 0.3);
  padding: 0.5rem;
  border-radius: 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 8px;
  font-weight: 500;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: #ffffff;
}

.nav-item i {
  width: 16px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid rgba(245, 101, 101, 0.3);
  color: #f56565;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: #f56565;
}
.logo-icon {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #48bb78;
  margin: 0;
}

.logo-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.student-badge {
  background: #48bb78;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: auto;
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  gap: 1rem;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: #ffffff;
  border-right: 3px solid #48bb78;
  color: #ffffff;
  border-right: 3px solid #48bb78;
}

.nav-item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 1rem 0;
}

.logout-item {
  color: #f56565 !important;
}

.logout-item:hover {
  background: rgba(245, 101, 101, 0.1) !important;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title i {
  color: #48bb78;
}

.page-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1rem;
}

.practice-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: var(--bg-primary);
}



.setup-section {
  max-width: 1200px;
  margin: 0 auto;
}

.setup-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.selection-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: fadeInUp 0.6s ease-out;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.selection-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-title i {
  color: #48bb78;
}

.mode-options, .topic-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.mode-option, .topic-option {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.mode-option:hover, .topic-option:hover {
  border-color: #48bb78;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(72, 187, 120, 0.2);
}

.mode-option.active, .topic-option.active {
  border-color: #48bb78;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  transform: scale(1.02);
}

.mode-icon, .topic-icon {
  font-size: 2rem;
  margin-right: 1rem;
  color: #48bb78;
  min-width: 60px;
  text-align: center;
}

.mode-option.active .mode-icon,
.topic-option.active .topic-icon {
  color: white;
}

.mode-info h4, .topic-info h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.mode-info p, .topic-info p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.duration-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.duration-option {
  padding: 1rem 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 600;
}

.duration-option:hover {
  border-color: #48bb78;
  transform: translateY(-2px);
}

.duration-option.active {
  border-color: #48bb78;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

/* Custom Input Styles */
.custom-input-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  animation: fadeInUp 0.4s ease-out;
}

.custom-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
}

.custom-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.custom-input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
}

.custom-input:focus {
  outline: none;
  border-color: #48bb78;
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.2);
}

.custom-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
  font-style: italic;
}

.start-section {
  text-align: center;
  animation: bounceIn 0.8s ease-out;
}

.start-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.3rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.start-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.start-btn i {
  margin-right: 0.5rem;
}

.typing-section {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
}

.typing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  padding: 2.5rem;
  border-radius: 16px;
  margin-bottom: 3rem;
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
}

.typing-stats {
  display: flex;
  gap: 4rem;
}

.stat-item {
  text-align: center;
  padding: 1rem 1.5rem;
  background: rgba(66, 153, 225, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(66, 153, 225, 0.2);
  min-width: 120px;
}

.stat-label {
  display: block;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #4299e1;
  text-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
}

.stop-btn {
  background: #ff4757;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stop-btn:hover {
  background: #ff3742;
  transform: translateY(-2px);
}

.typing-area {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
  max-width: 1200px;
  margin: 0 auto;
}

.text-display {
  font-size: 1.8rem;
  line-height: 2.2;
  margin-bottom: 3rem;
  padding: 2.5rem;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Segoe UI', 'Arial', sans-serif;
  color: var(--text-primary);
  min-height: 200px;
  letter-spacing: 0.5px;
  word-spacing: 2px;
  cursor: text;
  outline: none;
  transition: all 0.3s ease;
}

.text-display:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2);
  background: var(--bg-secondary);
}

.text-display span {
  transition: all 0.15s ease-in-out;
  border-radius: 3px;
  padding: 2px 1px;
}

.text-display span.correct {
  color: #48bb78;
  background: rgba(72, 187, 120, 0.1);
}

.text-display span.incorrect {
  color: #f56565;
  background: rgba(245, 101, 101, 0.15);
}

.text-display span.current {
  background: #4299e1;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(66, 153, 225, 0.4);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 8px rgba(66, 153, 225, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(66, 153, 225, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 8px rgba(66, 153, 225, 0.4);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  
  .sidebar.collapsed {
    width: 0;
    overflow: hidden;
  }
  
  .practice-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .mode-options, .topic-options {
    grid-template-columns: 1fr;
  }
  
  .typing-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .typing-header {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Completion Modal Styles */
.completion-modal-overlay {
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

.completion-modal {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-header h2 {
  color: var(--text-primary);
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.modal-body {
  margin-bottom: 2rem;
}

.final-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.final-stat {
  text-align: center;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.final-stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #68d391;
  margin-bottom: 0.5rem;
}

.final-stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.performance-message {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.performance-message p {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.new-practice-btn, .close-modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.new-practice-btn {
  background: #48bb78;
  color: white;
}

.new-practice-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
}

.close-modal-btn {
  background: #718096;
  color: white;
}

.close-modal-btn:hover {
  background: #4a5568;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .completion-modal {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .final-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .new-practice-btn, .close-modal-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>