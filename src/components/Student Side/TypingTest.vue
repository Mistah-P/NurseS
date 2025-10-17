<template>
  <div class="typing-test">
    <!-- Header Stats -->
    <header class="stats-header">
      <div class="stats-container centered">
        <div class="stat-item">
          <div class="stat-value">{{ currentWPM }}</div>
          <div class="stat-label">WPM</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentAccuracy }}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ currentVisibleErrors }}</div>
          <div class="stat-label">Errors</div>
        </div>
      </div>
      <div class="timer-container">
        <i class="fas fa-clock" v-if="gameMode === 'timed'"></i>
        <i class="fas fa-list-ol" v-if="gameMode === 'word-count'"></i>
        <span v-if="gameMode === 'timed' && timeRemaining > 0">{{ formatTime(timeRemaining) }}</span>
        <span v-if="gameMode === 'word-count'">{{ wordsTyped }}/{{ targetWordCount }} words</span>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">{{ Math.round(progress) }}% Complete</div>
    </div>

    <!-- Typing Area -->
    <div class="typing-container">
      <!-- Text Display with Direct Typing -->
      <div 
        class="text-display" 
        ref="textDisplay"
        tabindex="0"
        @keydown="handleKeydown"
        @focus="focusTyping"
        @blur="blurTyping"
        :class="{ 'focused': isFocused }"
      >
        <span 
          v-for="(char, index) in displayedText" 
          :key="index"
          :class="getCharClass(index)"
          class="char"
        ><template v-if="char === '\n'">
<br><span v-if="index === userInput.length - 1" class="cursor" :class="{ 'blink': isFocused }"></span></template><template v-else>{{ char }}<span v-if="index === userInput.length - 1" class="cursor" :class="{ 'blink': isFocused }"></span></template></span>
        
        <!-- Cursor at the beginning if no characters typed yet -->
        <span v-if="userInput.length === 0" class="cursor" :class="{ 'blink': isFocused }"></span>
        
        <!-- Fallback cursor at the end if we're at the end of text -->
        <span v-if="userInput.length >= displayedText.length" class="cursor" :class="{ 'blink': isFocused }"></span>
      </div>

      <!-- Instructions -->
      <div class="typing-instructions">
        <p v-if="!hasStarted">Click on the text above and start typing to begin the test</p>
        <p v-else-if="!isCompleted">Keep typing to complete the test</p>
      </div>

      <!-- Controls -->
      <div class="controls">
        <!-- Auto-start message instead of start button -->
        <div v-if="!hasStarted && !textToType" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          Loading typing test...
        </div>
        
        <div v-if="!hasStarted && textToType" class="auto-start-message">
          <i class="fas fa-play"></i>
          Click on the text above to start typing
        </div>

        <button 
          v-if="isCompleted" 
          @click="viewResults" 
          class="results-btn"
        >
          <i class="fas fa-chart-bar"></i>
          View Results
        </button>
      </div>
    </div>

    <!-- Completion Modal -->
    <div v-if="showCompletionModal" class="completion-modal-overlay">
      <div class="completion-modal" @click.stop>
        <div class="modal-header">
          <h2>🎉 Test Completed!</h2>
        </div>
        <div class="modal-body">
          <div class="final-stats">
            <div class="final-stat">
              <div class="final-stat-value">{{ finalWPM }}</div>
              <div class="final-stat-label">Words Per Minute</div>
            </div>
            <div class="final-stat">
              <div class="final-stat-value">{{ finalAccuracy }}%</div>
              <div class="final-stat-label">Accuracy</div>
            </div>
            <div class="final-stat">
              <div class="final-stat-value">{{ finalErrors }}</div>
              <div class="final-stat-label">Errors</div>
            </div>
            <div class="final-stat">
              <div class="final-stat-value">{{ formatTime(timeTaken) }}</div>
              <div class="final-stat-label">Time Taken</div>
            </div>
          </div>
          <div class="performance-message">
            <p>{{ getPerformanceMessage() }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="goBackToDashboard" class="back-to-dashboard-btn">
            <i class="fas fa-home"></i>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast', toast.type]"
      >
        <i 
          :class="[
            'toast-icon',
            toast.type === 'success' ? 'fas fa-check-circle' : 
            toast.type === 'error' ? 'fas fa-exclamation-circle' : 
            'fas fa-info-circle'
          ]"
        ></i>
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script>
import liveSessionService from '../../services/liveSessionService'
import sessionService from '../../services/sessionService'
import moduleService from '../../services/moduleService'
import typingResultsService from '../../services/typingResultsService'

export default {
  name: 'TypingTest',
  data() {
    return {
      roomCode: this.$route.params.roomCode,
      studentId: null,
      studentName: '',
      
      // Typing test data
      textToType: '',
      userInput: '',
      currentPosition: 0,
      
      // Text chunking for line-based display (replaces sentence-based)
      textChunks: [],
      currentChunkIndex: 0,
      displayedText: '',
      charactersPerLine: 80, // Approximate characters per line
      linesPerDisplay: 7, // Show 7 lines at once
      
      // Stats - Enhanced for continuous calculation
      currentWPM: 0,
      currentAccuracy: 100,
      progress: 0,
      totalCorrectChars: 0, // Track total correct characters across all chunks
      totalTypedChars: 0,   // Track total typed characters across all chunks
      totalErrors: 0,       // Track total errors across all chunks
      currentVisibleErrors: 0, // Track only currently visible red characters
      finalErrorsForDatabase: 0, // Track correct final error count for database saving
      
      // Timing
      startTime: null,
      endTime: null,
      timeRemaining: 0,
      timeTaken: 0,
      
      // Game mode
      gameMode: 'timed', // 'timed' or 'word-count'
      targetWordCount: 0,
      wordsTyped: 0,
      
      // State
      hasStarted: false,
      isCompleted: false,
      showCompletionModal: false,
      hasTimeLimit: false,
      isFocused: false,
      
      // Final results
      finalWPM: 0,
      finalAccuracy: 100,
      finalErrors: 0,
      
      // Intervals
      statsInterval: null,
      progressUpdateInterval: null,
      timeLimitInterval: null,
      
      // Listeners
      liveSessionListener: null,
      
      // Toast notifications
      toasts: []
    }
  },
  computed: {
    wpm() {
      return this.currentWPM
    },
    accuracy() {
      return this.currentAccuracy
    },
    completionRate() {
      if (!this.displayedText || this.displayedText.length === 0) return 0
      return Math.round((this.userInput.length / this.displayedText.length) * 100)
    },
    currentIndex() {
      return this.currentPosition
    }
  },
  async mounted() {
    await this.initializeTest()
    // Auto-focus the typing area after everything is loaded
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.$refs.textDisplay) {
          this.$refs.textDisplay.focus()
        }
      }, 100)
    })
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    async initializeTest() {
      try {
        // Get student data from Firebase session instead of sessionStorage
        const studentSession = await sessionService.getStudentSession()
        
        if (studentSession && studentSession.studentData) {
          this.studentId = studentSession.studentData.studentId
          this.studentName = studentSession.studentData.studentName
          console.log('Student data loaded from Firebase:', {
            studentId: this.studentId,
            studentName: this.studentName,
            roomCode: this.roomCode
          })
        } else {
          console.error('No student session found in Firebase')
          this.showToast('Student session not found. Please rejoin the room.', 'error')
          this.$router.push(`/student-room/${this.roomCode}`)
          return
        }
        
        // Subscribe to live session for text content and updates
        this.liveSessionListener = liveSessionService.subscribeToLiveSession(
          this.roomCode,
          this.handleLiveSessionUpdate
        )
        
      } catch (error) {
        console.error('Error initializing typing test:', error)
        this.showToast('Failed to initialize typing test', 'error')
      }
    },

    handleLiveSessionUpdate(update) {
      if (update.exists && update.data) {
        const sessionData = update.data
        console.log('📊 TypingTest received live session update:', sessionData)
        
        // Set the text to type from the module content with difficulty transformation
        if (sessionData.moduleContent && !this.textToType) {
          this.loadModuleContent(sessionData.moduleContent, sessionData.difficulty)
        }
        
        // Handle game mode and limits
        if (sessionData.settings && sessionData.settings.gameMode) {
          this.gameMode = sessionData.settings.gameMode
        }
        
        // Handle time limit for timed mode
        if (this.gameMode === 'timed' && sessionData.timeLimit && sessionData.timeLimit > 0 && sessionData.startedAt) {
          // Only set time limit if not already set or if timer is not running
          if (!this.hasTimeLimit || !this.timeLimitInterval) {
            // Calculate remaining time based on server timestamp for synchronization
            const remainingTime = this.calculateRemainingTime(sessionData.startedAt, sessionData.timeLimit)
            
            this.timeRemaining = remainingTime
            this.hasTimeLimit = true
            
            // Only start timer if there's time remaining
            if (remainingTime > 0) {
              this.startTimeLimit()
              console.log('⏰ Server-synchronized time limit set to:', this.timeRemaining, 'seconds')
            } else {
              console.log('⏰ Time limit already expired, auto-completing test')
              this.completeTest()
            }
          }
        } else if (this.gameMode === 'timed' && sessionData.timeLimit && sessionData.timeLimit > 0 && !sessionData.startedAt) {
          // Activity has time limit but hasn't started yet (still in countdown)
          console.log('⏰ Time limit configured but activity not started yet (countdown phase)')
          this.hasTimeLimit = false
        } else if (this.gameMode === 'word-count' && sessionData.wordCount && sessionData.wordCount > 0) {
          // Handle word count mode
          this.targetWordCount = sessionData.wordCount
          console.log('📝 Word count target set to:', this.targetWordCount, 'words')
          this.hasTimeLimit = false
        } else {
          this.hasTimeLimit = false
           console.log('⏰ No time limit set - unlimited typing mode')
         }
        
        // Handle session status changes
        if (sessionData.status === 'completed' && !this.isCompleted) {
          this.completeTest()
        }
        
        // Handle countdown to active transition
        if (sessionData.status === 'active' && !this.hasStarted) {
          console.log('🚀 Session is now active, auto-starting typing test')
          this.startTyping()
        }
      }
    },

    // Helper method to calculate remaining time from server timestamp
    calculateRemainingTime(startedAt, timeLimit) {
      if (!startedAt || !timeLimit) return timeLimit || 0
      
      const now = new Date()
      const activityStartTime = new Date(startedAt)
      const elapsedSeconds = Math.floor((now - activityStartTime) / 1000)
      const remainingTime = Math.max(0, timeLimit - elapsedSeconds)
      
      console.log('⏰ Server sync - Activity started at:', activityStartTime.toISOString())
      console.log('⏰ Server sync - Elapsed seconds:', elapsedSeconds)
      console.log('⏰ Server sync - Remaining time:', remainingTime)
      
      return remainingTime
    },

    async loadModuleContent(moduleId, difficulty = null) {
      try {
        console.log('Loading module content for:', moduleId, 'with difficulty:', difficulty)
        
        // Initialize moduleService if not already done
        await moduleService.initialize()
        
        // Get the module content with difficulty transformation if specified
        let moduleContent;
        if (difficulty) {
          moduleContent = await moduleService.getModuleContentWithDifficulty(moduleId, difficulty)
          console.log('✅ Module content loaded with difficulty transformation:', difficulty)
        } else {
          moduleContent = await moduleService.getModuleContent(moduleId)
          console.log('✅ Module content loaded without transformation')
        }
        
        if (moduleContent && moduleContent.trim().length > 0) {
          this.textToType = moduleContent
          this.splitIntoSentences(moduleContent)
          console.log('✅ Module content loaded successfully, length:', moduleContent.length)
        } else {
          throw new Error(`Module content is empty for: ${moduleId}`)
        }
        
      } catch (error) {
        console.error('❌ Error loading module content:', error)
        this.showToast(`Failed to load module content: ${error.message}`, 'error')
        // Don't use fallback - show error to user and redirect
        this.$router.push(`/student-room/${this.roomCode}`)
      }
    },

    startTimeLimit() {
      if (this.timeRemaining <= 0) return
      
      // Clear any existing timer to prevent multiple timers
      if (this.timeLimitInterval) {
        clearInterval(this.timeLimitInterval)
        this.timeLimitInterval = null
      }
      
      console.log('⏰ Starting time limit countdown:', this.timeRemaining, 'seconds')
      
      this.timeLimitInterval = setInterval(() => {
        this.timeRemaining--
        
        if (this.timeRemaining <= 0) {
          console.log('⏰ Time limit reached - auto-completing test')
          clearInterval(this.timeLimitInterval)
          this.timeLimitInterval = null
          this.completeTest()
        }
      }, 1000)
    },

    startTyping() {
      if (this.hasStarted) return
      
      this.hasStarted = true
      this.startTime = Date.now()
      
      // Focus on text display for direct typing
      this.$nextTick(() => {
        if (this.$refs.textDisplay) {
          this.$refs.textDisplay.focus()
        }
      })
      
      // Start stats calculation interval
      this.statsInterval = setInterval(() => {
        this.calculateStats()
      }, 1000)
      
      // Start progress update interval (send to server every 2 seconds)
      this.progressUpdateInterval = setInterval(() => {
        this.updateServerProgress()
      }, 2000)
      
      // Update student status to typing
      this.updateStudentStatus('typing')
    },

    handleInput() {
      if (!this.hasStarted) {
        this.startTyping()
      }
      
      this.currentPosition = this.userInput.length
      this.calculateStats()
      
      // For word count mode, check if target word count is reached FIRST
      if (this.gameMode === 'word-count' && this.wordsTyped >= this.targetWordCount) {
        if (!this.isCompleted) {
          console.log('🎯 Target word count reached - finishing test')
          this.completeTest()
        }
        return
      }
      
      // Check if current chunk is complete (all text typed correctly)
      if (this.userInput.length >= this.displayedText.length) {
        // For word count mode, don't end on chunk completion - continue to next chunk
        if (this.gameMode === 'word-count') {
          // Check if we need to show the next chunk
          if (this.currentChunkIndex < this.textChunks.length - 1) {
            this.showNextChunk()
          } else {
            // If no more chunks but haven't reached word target, continue with current chunk
            console.log('📝 All text chunks completed but word target not reached - continuing')
          }
          return
        }
        
        // For timed mode or other modes, complete when all chunks are done
        if (this.currentChunkIndex < this.textChunks.length - 1) {
          this.showNextChunk()
        } else {
          console.log('🎯 All text completed - finishing test')
          this.completeTest()
        }
        return
      }
    },

    handleKeydown(event) {
      // Prevent certain keys that might break the test
      if (event.key === 'Tab') {
        event.preventDefault()
        return
      }
      
      // Handle typing for direct input
      if (this.isCompleted || (this.timeRemaining === 0 && this.hasTimeLimit)) {
        event.preventDefault()
        return
      }
      
      // Handle backspace
      if (event.key === 'Backspace') {
        event.preventDefault()
        if (this.userInput.length > 0) {
          this.userInput = this.userInput.slice(0, -1)
          this.handleInput()
        }
        return
      }
      
      // Handle regular character input
      if (event.key.length === 1) {
        event.preventDefault()
        this.userInput += event.key
        this.handleInput()
      }
    },

    focusTyping() {
      this.isFocused = true
    },

    blurTyping() {
      this.isFocused = false
    },

    calculateStats() {
      if (!this.hasStarted || !this.startTime) return
      
      const currentTime = Date.now()
      const timeElapsed = (currentTime - this.startTime) / 1000 / 60 // minutes
      
      if (timeElapsed <= 0) return
      
      // Enhanced continuous calculation - accumulate stats across all sentences
      let totalCorrectChars = this.totalCorrectChars
      let totalTypedChars = this.totalTypedChars
      let totalErrors = this.totalErrors
      
      // Add current sentence stats
      let currentCorrectChars = 0
      let currentErrorChars = 0
      for (let i = 0; i < this.userInput.length; i++) {
        if (i < this.displayedText.length) {
          if (this.userInput[i] === this.displayedText[i]) {
            currentCorrectChars++
          } else {
            // Only count as error if character is actually typed incorrectly (red character)
            currentErrorChars++
          }
        }
        // Don't count characters typed beyond the displayed text length as errors
      }
      
      // Total stats = previous sentences + current sentence
      const allCorrectChars = totalCorrectChars + currentCorrectChars
      const allTypedChars = totalTypedChars + this.userInput.length
      const allErrors = totalErrors + currentErrorChars
      
      // For display purposes, show only current visible errors (red characters)
      // But keep totalErrors for final statistics
      this.currentVisibleErrors = currentErrorChars
      this.totalErrors = allErrors
      
      // Calculate Net WPM using total correct characters across all sentences
      const netWPM = Math.round((allCorrectChars / 5) / timeElapsed)
      this.currentWPM = Math.max(0, netWPM)
      
      // Calculate accuracy using total characters across all sentences
      this.currentAccuracy = allTypedChars > 0 
        ? Math.round((allCorrectChars / allTypedChars) * 100) 
        : 100
      
      // Ensure accuracy doesn't go below 0
      this.currentAccuracy = Math.max(0, this.currentAccuracy)
      
      // Calculate progress based on total text completion
      const totalCompletedChars = totalTypedChars + this.userInput.length
      this.progress = Math.min(100, (totalCompletedChars / this.textToType.length) * 100)
      
      // Update word count for word-count mode
      if (this.gameMode === 'word-count') {
        // Count actual completed words instead of character-based calculation
        this.wordsTyped = this.countCompletedWords()
      }
    },
    
    countCompletedWords() {
      // Simple and safe word counting: count correctly typed words in current displayed text
      if (!this.userInput || !this.displayedText) {
        return 0
      }
      
      // Split both user input and displayed text into words
      const userWords = this.userInput.trim().split(/\s+/).filter(word => word.length > 0)
      const displayWords = this.displayedText.trim().split(/\s+/).filter(word => word.length > 0)
      
      let correctWords = 0
      
      // Count words that are completely and correctly typed
      for (let i = 0; i < userWords.length && i < displayWords.length; i++) {
        if (userWords[i] === displayWords[i]) {
          correctWords++
        }
      }
      
      return correctWords
    },
    

    
    splitIntoSentences(text) {
      // NEW: Split text into line-based chunks instead of sentences
      this.splitIntoLineChunks(text)
    },
    
    splitIntoLineChunks(text) {
      // Split text into chunks that display approximately 7 lines
      const words = text.split(/\s+/).filter(word => word.length > 0)
      const chunks = []
      let currentChunk = ''
      let currentLineCount = 0
      let currentLineLength = 0
      
      for (const word of words) {
        const wordWithSpace = (currentChunk ? ' ' : '') + word
        const newLineLength = currentLineLength + wordWithSpace.length
        
        // Check if adding this word would exceed line length
        if (newLineLength > this.charactersPerLine && currentChunk) {
          // Start new line
          currentLineCount++
          currentLineLength = word.length
          
          // Check if we've reached the line limit for this chunk
          if (currentLineCount >= this.linesPerDisplay) {
            // Save current chunk and start new one
            chunks.push(currentChunk.trim())
            currentChunk = word
            currentLineCount = 1
            currentLineLength = word.length
          } else {
            // Continue current chunk on new line
            currentChunk += '\n' + word
          }
        } else {
          // Add word to current line
          currentChunk += wordWithSpace
          currentLineLength = newLineLength
        }
      }
      
      // Add the last chunk if it has content
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      
      this.textChunks = chunks
      this.currentChunkIndex = 0
      
      // Reset accumulated stats when loading new content
      this.totalCorrectChars = 0
      this.totalTypedChars = 0
      
      // Display first chunk
      this.updateDisplayedText()
      
      console.log('📝 Split into', chunks.length, 'line-based chunks, showing first chunk with ~7 lines')
    },
    
    updateDisplayedText() {
      // Show current chunk (approximately 7 lines)
      if (this.currentChunkIndex < this.textChunks.length) {
        this.displayedText = this.textChunks[this.currentChunkIndex]
        console.log(`📝 Displaying chunk ${this.currentChunkIndex + 1} of ${this.textChunks.length}`)
      }
    },
    
    showNextSentence() {
      // Renamed to showNextChunk for clarity
      this.showNextChunk()
    },
    
    showNextChunk() {
      // Store stats from completed chunk
      let correctChars = 0
      for (let i = 0; i < this.userInput.length; i++) {
        if (i < this.displayedText.length && this.userInput[i] === this.displayedText[i]) {
          correctChars++
        }
      }
      
      // Accumulate total stats
      this.totalCorrectChars += correctChars
      this.totalTypedChars += this.userInput.length
      // Note: totalErrors is now tracked in real-time in calculateStats()
      
      this.currentChunkIndex++
      
      if (this.currentChunkIndex < this.textChunks.length) {
        // Show next chunk
        this.updateDisplayedText()
        // Reset user input for new chunk
        this.userInput = ''
        this.currentPosition = 0
        
        console.log('📝 Advanced to chunk', this.currentChunkIndex + 1, 'of', this.textChunks.length)
        this.showToast(`Chunk ${this.currentChunkIndex + 1} of ${this.textChunks.length}`, 'info')
      }
    },

    async updateServerProgress() {
      if (!this.hasStarted || this.isCompleted) return
      
      try {
        const progressData = {
          wpm: this.currentWPM,
          accuracy: this.currentAccuracy,
          progress: this.progress, // Use 'progress' instead of 'completionRate'
          currentPosition: this.currentPosition,
          status: 'typing', // Add required status field
          errorsCount: this.currentVisibleErrors
        }
        
        console.log('📊 Updating server progress:', progressData)
        
        await liveSessionService.updateStudentProgress(
          this.roomCode,
          this.studentId,
          progressData
        )
        
        console.log('✅ Progress updated successfully')
      } catch (error) {
        console.error('❌ Error updating progress:', error)
      }
    },

    async updateStudentStatus(status) {
      try {
        await liveSessionService.updateStudentProgress(this.roomCode, this.studentId, {
          status,
          wpm: this.currentWPM,
          accuracy: this.currentAccuracy,
          progress: Math.round(this.progress),
          currentPosition: this.currentPosition,
          errorsCount: this.currentVisibleErrors
        })
      } catch (error) {
        console.error('Error updating student status:', error)
      }
    },

    async completeTest() {
      if (this.isCompleted) return
      
      console.log('🏁 Completing typing test')
      
      this.isCompleted = true
      this.endTime = Date.now()
      this.timeTaken = (this.endTime - this.startTime) / 1000
      
      // Calculate final stats
      this.finalWPM = this.currentWPM
      this.finalAccuracy = this.currentAccuracy
      this.finalErrors = this.currentVisibleErrors
      
      // Calculate correct final error count for database (count only actual incorrect characters)
      this.finalErrorsForDatabase = this.currentVisibleErrors
      
      // Clear all intervals
      if (this.statsInterval) {
        clearInterval(this.statsInterval)
        this.statsInterval = null
      }
      
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval)
        this.progressUpdateInterval = null
      }
      
      if (this.timeLimitInterval) {
        clearInterval(this.timeLimitInterval)
        this.timeLimitInterval = null
      }
      
      // Send final progress to server with completion data
      try {
        const finalProgressData = {
          wpm: this.currentWPM,
          accuracy: this.currentAccuracy,
          progress: this.progress, // Use 'progress' instead of 'completionRate'
          currentPosition: this.currentPosition,
          status: 'completed', // Add required status field
          errorsCount: this.totalErrors
        }
        
        console.log('📊 Sending final progress data:', finalProgressData)
        
        await liveSessionService.updateStudentProgress(
          this.roomCode,
          this.studentId,
          finalProgressData
        )
        
        await this.updateStudentStatus('completed')
        
        console.log('✅ Final progress sent successfully')
      } catch (error) {
        console.error('❌ Error sending final progress:', error)
      }
      
      // Save typing results to database
      try {
        await typingResultsService.saveRoomResult({
          roomCode: this.roomCode,
          wpm: this.currentWPM,
          accuracy: this.currentAccuracy,
          duration: this.timeTaken,
          wordsTyped: this.wordsTyped,
          errorsCount: this.finalErrorsForDatabase,
          topic: 'Medical Typing Practice',
          difficulty: 'Medium',
          textLength: this.textToType ? this.textToType.length : this.displayedText ? this.displayedText.length : 1,
          completedAt: new Date().toISOString()
        })
        console.log('✅ Typing results saved to database')
      } catch (error) {
        console.error('❌ Error saving typing results:', error)
        // Don't show error to user to avoid disrupting the experience
      }
      
      // Show completion modal
      this.showCompletionModal = true
      
      this.showToast('Test completed!', 'success')
    },

    resetTest() {
      // Reset all data
      this.userInput = ''
      this.currentPosition = 0
      this.currentWPM = 0
      this.currentAccuracy = 100
      this.progress = 0
      this.hasStarted = false
      this.isCompleted = false
      this.startTime = null
      this.endTime = null
      
      // Reset word count mode properties
      this.wordsTyped = 0
      
      // Reset accumulated stats - FIX: This was missing and causing WPM to accumulate incorrectly
      this.totalCorrectChars = 0
      this.totalTypedChars = 0
      
      // Reset sentence progression
      this.currentSentenceIndex = 0
      if (this.sentences.length > 0) {
        this.displayedText = this.sentences[0]
      }
      
      // Clear intervals
      if (this.statsInterval) {
        clearInterval(this.statsInterval)
        this.statsInterval = null
      }
      
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval)
        this.progressUpdateInterval = null
      }
      
      // Update server
      this.updateStudentStatus('ready')
    },

    getCharClass(index) {
      if (index < this.userInput.length) {
        // Character has been typed
        if (this.userInput[index] === this.displayedText[index]) {
          return 'correct'
        } else {
          return 'incorrect'
        }
      } else if (index === this.userInput.length) {
        // Current character to type
        return 'current'
      } else {
        // Not yet typed
        return 'pending'
      }
    },

    getPerformanceMessage() {
      if (this.finalWPM >= 60) {
        return "Excellent typing speed! You're a typing master! 🚀"
      } else if (this.finalWPM >= 40) {
        return "Great job! Your typing speed is above average! 👏"
      } else if (this.finalWPM >= 25) {
        return "Good work! Keep practicing to improve your speed! 💪"
      } else {
        return "Nice effort! Practice makes perfect! 🌟"
      }
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },

    closeCompletionModal() {
      this.showCompletionModal = false
    },

    viewResults() {
      this.showCompletionModal = true
    },

    goBackToRoom() {
      this.$router.push(`/student-room/${this.roomCode}`)
    },

    goBackToDashboard() {
      this.$router.push('/user')
    },

    cleanup() {
      if (this.statsInterval) {
        clearInterval(this.statsInterval)
      }
      
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval)
      }
      
      if (this.timeLimitInterval) {
        clearInterval(this.timeLimitInterval)
      }
      
      if (this.liveSessionListener) {
        this.liveSessionListener()
      }
    },

    showToast(message, type = 'info') {
      const toast = {
        id: Date.now(),
        message,
        type
      }
      
      this.toasts.push(toast)
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        const index = this.toasts.findIndex(t => t.id === toast.id)
        if (index > -1) {
          this.toasts.splice(index, 1)
        }
      }, 3000)
    }
  }
}
</script>

<style scoped>
.typing-test {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.stats-container {
  display: flex;
  gap: 3rem;
}

.stats-container.centered {
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timer-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(102, 126, 234, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
}

.no-time-limit {
  color: #68d391;
  font-weight: 700;
}

.progress-container {
  padding: 1rem 2rem;
  background: var(--bg-tertiary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.typing-container {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.text-display {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 3rem;
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-size: 1.6rem;
  line-height: 2.4;
  min-height: 300px;
  margin: 0 auto;
  outline: none;
  cursor: text;
  transition: all 0.3s ease;
  position: relative;
  color: var(--text-primary);
  letter-spacing: 0.3px;
  word-spacing: 1px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.text-display:focus,
.text-display.focused {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.cursor {
  display: inline-block;
  width: 3px;
  height: 1.6em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  margin-left: 1px;
  vertical-align: text-top;
  box-shadow: 0 0 8px rgba(102, 126, 234, 0.5);
}

.cursor.blink {
  animation: cursorBlink 1.2s infinite ease-in-out;
}

@keyframes cursorBlink {
  0%, 50% { 
    opacity: 1; 
    transform: scaleY(1);
  }
  51%, 100% { 
    opacity: 0.3; 
    transform: scaleY(0.8);
  }
}

.typing-instructions {
  text-align: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.typing-instructions p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

.char {
  position: relative;
  display: inline;
  transition: all 0.2s ease;
}

.char.correct {
  color: #68d391; /* Brighter green for better visibility */
  text-shadow: 0 0 4px rgba(104, 211, 145, 0.3);
}

.char.incorrect {
  color: #fc8181; /* Brighter red for better visibility */
  text-shadow: 0 0 4px rgba(252, 129, 129, 0.3);
  background: rgba(252, 129, 129, 0.1);
  border-radius: 3px;
}

.char.current {
  color: var(--text-primary);
  background: rgba(102, 126, 234, 0.2);
  border-radius: 3px;
 
}

.char.pending {
  color: var(--text-secondary);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.loading-message, .auto-start-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  color: #667eea;
  font-weight: 600;
  font-size: 1rem;
}

.loading-message i, .auto-start-message i {
  font-size: 1.2rem;
}
.typing-instructions {
  text-align: center;
  margin: 1rem 0;
}

.typing-instructions p {
  color: #a0aec0;
  font-size: 0.95rem;
  margin: 0;
}

.char {
  position: relative;
  display: inline;
}

.char.correct {
  color: #48bb78; /* Green for correct */
}

.char.incorrect {
  color: #f56565; /* Red for incorrect */
}

.char.current {
  color: #2a394d; /* Default text color for current character */
}

.char.pending {
  color: #a0aec0; /* Gray for pending characters */
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.input-container {
  position: relative;
}

.typing-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: all 0.3s ease;
}

.typing-input:focus {
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.typing-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.typing-input::placeholder {
  color: var(--text-secondary);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.start-btn, .reset-btn, .results-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.start-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: var(--text-primary);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.reset-btn {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: var(--text-primary);
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
}

.results-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--text-primary);
}

.results-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.completion-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.completion-modal {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  transform: scale(1);
  animation: modalAppear 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 2rem;
}

.final-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .5rem;
  margin-bottom: 2rem;
}

.final-stat {
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
}

.final-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.final-stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.performance-message {
  text-align: center;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.performance-message p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #667eea;
}

.modal-footer {
  padding: 2rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.back-to-dashboard-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: var(--text-primary);
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-to-dashboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 500;
  animation: slideInRight 0.3s ease-out;
  min-width: 250px;
}

.toast.success {
  border-color: #48bb78;
  background: rgba(72, 187, 120, 0.1);
}

.toast.info {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.toast.error {
  border-color: #f56565;
  background: rgba(245, 101, 101, 0.1);
}

.toast-icon {
  color: currentColor;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>