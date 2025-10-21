<template>
  <div class="student-room-interface">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Joining room...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <h2>{{ error }}</h2>
      <button @click="goBack" class="btn btn-primary">Go Back</button>
    </div>

    <!-- Main Interface -->
    <div v-else class="room-content">
      <!-- Header -->
      <header class="room-header">
        <div class="header-content">
          <div class="room-info">
            <h1>{{ roomData.activityName }}</h1>
            <div class="room-details">
              <span class="room-code">Room: {{ roomCode }}</span>
              <span class="separator">•</span>
              <span class="teacher-name">{{ roomData.teacherName }}</span>
              <span class="separator">•</span>
              <span class="status" :class="roomData.status">{{ getStatusLabel(roomData.status) }}</span>
            </div>
          </div>
          <div class="student-info">
            <div class="student-avatar">
              <span>{{ studentData.studentName.charAt(0) }}</span>
            </div>
            <div class="student-details">
              <span class="student-name">{{ studentData.studentName }}</span>
              <span class="student-status" :class="studentData.status">{{ getStudentStatusLabel(studentData.status) }}</span>
            </div>
            <button @click="exitRoom" class="exit-btn" title="Exit Room">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 2.58579C3.96086 2.21071 4.46957 2 5 2H9" stroke="currentColor" stroke-width="2"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"/>
              </svg>
              Exit
            </button>
          </div>
        </div>
      </header>

      <!-- Activity Status -->
      <div class="activity-status">
        <!-- Countdown Display -->
        <div v-if="showCountdown && countdownRemaining > 0" class="countdown-status">
          <div class="countdown-circle">
            <div class="countdown-number">{{ countdownRemaining }}</div>
          </div>
          <h3>Activity starting in {{ countdownRemaining }} seconds</h3>
          <p v-if="isAIPatientActivity">Get ready for your AI Patient simulation!</p>
          <p v-else>Get ready to type!</p>
        </div>

        <div v-else-if="roomData.status === 'waiting'" class="waiting-status">
          <div class="status-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 v-if="isAIPatientActivity">Waiting for teacher to start the AI Patient simulation</h3>
          <h3 v-else>Waiting for teacher to start the activity</h3>
          <p v-if="isAIPatientActivity">Stay on this page. The simulation will begin automatically when your teacher starts it.</p>
          <p v-else>Stay on this page. The activity will begin automatically when your teacher starts it.</p>
        </div>

        <div v-else-if="roomData.status === 'active'" class="active-status">
          <div class="status-icon active">
            <svg v-if="isAIPatientActivity" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="5,3 19,12 5,21" fill="currentColor"/>
            </svg>
          </div>
          <h3 v-if="isAIPatientActivity">AI Patient simulation is now active!</h3>
          <h3 v-else>Activity is now active!</h3>
          <p v-if="isAIPatientActivity">You will be automatically redirected to the AI Patient simulation...</p>
          <p v-else>You will be automatically redirected to the typing test...</p>
        </div>

        <div v-else-if="roomData.status === 'completed'" class="completed-status">
          <div class="status-icon completed">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2"/>
              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 v-if="isAIPatientActivity">AI Patient simulation completed</h3>
          <h3 v-else>Activity completed</h3>
          <p>Thank you for participating! You can now close this window.</p>
        </div>
      </div>

      <!-- Student Progress (if activity is active) -->
      <div v-if="roomData.status === 'active'" class="progress-section">
        <!-- AI Patient Progress -->
        <div v-if="isAIPatientActivity" class="progress-card">
          <h4>Your Simulation Progress</h4>
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-value">{{ studentData.interactions || 0 }}</div>
              <div class="stat-label">Interactions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ studentData.assessments || 0 }}</div>
              <div class="stat-label">Assessments</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ studentData.progress || 0 }}%</div>
              <div class="stat-label">Complete</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (studentData.progress || 0) + '%' }"></div>
          </div>
        </div>
        
        <!-- Typing Test Progress -->
        <div v-else class="progress-card">
          <h4>Your Progress</h4>
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-value">{{ studentData.wpm }}</div>
              <div class="stat-label">WPM</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ studentData.accuracy }}%</div>
              <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ studentData.progress }}%</div>
              <div class="stat-label">Complete</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: studentData.progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Other Students -->
      <div class="other-students-section">
        <h4 v-if="isAIPatientActivity">Other Participants ({{ otherStudents.length }})</h4>
        <h4 v-else>Other Students ({{ otherStudents.length }})</h4>
        <div class="students-list">
          <div 
            v-for="student in otherStudents" 
            :key="student.studentId"
            class="student-item"
          >
            <div class="student-avatar small">
              <span>{{ student.studentName.charAt(0) }}</span>
            </div>
            <div class="student-info">
              <div class="student-name">{{ student.studentName }}</div>
              <div class="student-progress">{{ student.progress || 0 }}% complete</div>
            </div>
            <div v-if="isAIPatientActivity" class="student-stats">
              <span class="interactions">{{ student.interactions || 0 }} interactions</span>
            </div>
            <div v-else class="student-stats">
              <span class="wpm">{{ student.wpm || 0 }} WPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Kick Notification Modal -->
    <div v-if="showKickModal" class="kick-modal-overlay">
      <div class="kick-modal">
        <div class="kick-modal-header">
          <div class="kick-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f56565" stroke-width="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="#f56565" stroke-width="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="#f56565" stroke-width="2"/>
            </svg>
          </div>
          <h2>You've been removed from the room</h2>
        </div>
        <div class="kick-modal-body">
          <p>The teacher has removed you from this typing room. You will be redirected back to your dashboard.</p>
        </div>
        <div class="kick-modal-footer">
          <button @click="handleKickConfirmation" class="kick-ok-btn">
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else-if="toast.type === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../../firebase/init';
import { onAuthStateChanged } from 'firebase/auth';
import sessionService from '../../services/sessionService';
import liveSessionService from '../../services/liveSessionService';

export default {
  name: 'StudentRoomInterface',
  data() {
    return {
      roomCode: this.$route.params.roomCode,
      isLoading: true,
      error: null,
      roomData: {},
      studentData: {},
      otherStudents: [],
      pollingInterval: null,
      showKickModal: false,
      currentUser: null,
      // Live session data
      roomListener: null,
      liveSessionListener: null,
      liveSessionData: null,
      countdownRemaining: 0,
      countdownInterval: null,
      showCountdown: false,
      toasts: []
    }
  },
  computed: {
    isAIPatientActivity() {
      // Check if this is an AI Patient activity
      return this.roomData && (
        (this.roomData.mode && this.roomData.mode.includes('AI Patient')) ||
        (this.roomData.module && this.roomData.module.includes('AI Patient'))
      );
    }
  },
  async mounted() {
    // Set up Firebase Auth state listener
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        try {
          // Get student session from Firestore
          const studentSession = await sessionService.getStudentSession();
          
          if (studentSession && studentSession.studentData && studentSession.studentData.roomCode === this.roomCode) {
            // Use the student data from the session
            this.studentData = {
              studentId: studentSession.studentData.studentId,
              studentName: studentSession.studentData.studentName,
              roomCode: studentSession.studentData.roomCode
            };
            await this.loadRoomData();
            this.setupRoomListener();
            this.startPolling();
          } else {
            this.error = 'Student session not found or room mismatch. Please join the room again.';
            this.isLoading = false;
          }
        } catch (error) {
          console.error('Error loading student session:', error);
          this.error = 'Failed to load student session';
          this.isLoading = false;
        }
      } else {
        this.error = 'Authentication required. Please join the room again.';
        this.isLoading = false;
      }
    });
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    async loadRoomData() {
      try {
        // Load room data
        const roomResponse = await this.$roomAPI.getRoomByCode(this.roomCode);
        this.roomData = roomResponse.data;

        // Load all students in the room
        const studentsResponse = await this.$studentAPI.getStudentsInRoom(this.roomCode);
        const allStudents = studentsResponse.data;

        // Find current student and update local data
        const currentStudent = allStudents.find(s => s.studentId === this.studentData.studentId);
        if (currentStudent) {
          this.studentData = { ...this.studentData, ...currentStudent };
        } else {
          // Student not found in room - they've been kicked
          this.handleStudentKicked();
          return;
        }

        // Get other students
        this.otherStudents = allStudents.filter(s => s.studentId !== this.studentData.studentId);

        this.isLoading = false;
      } catch (error) {
        console.error('Error loading room data:', error);
        this.error = 'Failed to load room data';
        this.isLoading = false;
      }
    },

    startPolling() {
      // Poll for updates every 3 seconds
      this.pollingInterval = setInterval(async () => {
        await this.loadRoomData();
      }, 3000);
    },

    getStatusLabel(status) {
      const labels = {
        'waiting': 'Waiting',
        'active': 'Active',
        'completed': 'Completed'
      };
      return labels[status] || status;
    },

    getStudentStatusLabel(status) {
      const labels = {
        'ready': 'Ready',
        'active': 'Typing',
        'completed': 'Finished'
      };
      return labels[status] || status;
    },

    startTyping() {
      console.log('🚀 Starting activity - Current route:', this.$route.path)
      console.log('Student data:', this.studentData)
      console.log('Room code:', this.roomCode)
      console.log('Room data:', this.roomData)
      
      // Safety check: Don't navigate if session is in countdown state
      if (this.liveSessionData && this.liveSessionData.status === 'countdown') {
        console.log('⚠️ Cannot start activity during countdown phase')
        this.showToast('Please wait for the countdown to finish before starting the activity.', 'warning')
        return
      }
      
      // Determine the route based on room type
      let routeConfig;
      let fallbackPath;
      
      // Check if this is an AI Patient room
      if (this.roomData && (this.roomData.mode === 'AI Patient' || this.roomData.module === 'AI Patient Simulation')) {
        console.log('🤖 Redirecting to AI Patient room interface')
        routeConfig = {
          name: 'AIPatientRoom',
          params: { roomCode: this.roomCode }
        }
        fallbackPath = `/ai-patient-room/${this.roomCode}`
      } else {
        console.log('⌨️ Redirecting to Typing Test interface')
        routeConfig = {
          name: 'TypingTest',
          params: { roomCode: this.roomCode }
        }
        fallbackPath = `/typing-test/${this.roomCode}`
      }
      
      console.log('Attempting to navigate with config:', routeConfig)
      
      // Use nextTick to ensure DOM updates are complete before navigation
      this.$nextTick(() => {
        this.$router.push(routeConfig).then(() => {
          console.log('✅ Student navigation successful to', routeConfig.name, 'with roomCode:', this.roomCode)
        }).catch((error) => {
          console.error('❌ Student navigation failed:', error)
          // Fallback to path-based navigation
          console.log('Trying fallback navigation to:', fallbackPath)
          this.$router.push(fallbackPath).catch((fallbackError) => {
            console.error('❌ Fallback navigation also failed:', fallbackError)
            this.showToast('Navigation failed. Please refresh the page.', 'error')
          })
        })
      })
    },

    async updateStudentStatus(status) {
      try {
        await this.$studentAPI.updateProgress(this.studentData.studentId, {
          roomCode: this.roomCode,
          status: status
        });
      } catch (error) {
        console.error('Error updating student status:', error);
      }
    },

    async exitRoom() {
      if (!confirm('Are you sure you want to exit the room? You will need to rejoin to continue.')) {
        return;
      }

      try {
        // Call the leave room API
        await this.$studentAPI.leaveRoom(this.studentData.studentId, this.roomCode);
        
        // Clear student session from Firestore
        await sessionService.destroyStudentSession();
        
        // Sign out from Firebase Auth
        if (auth.currentUser) {
          await auth.signOut();
        }
        
        // Cleanup listeners and intervals
        this.cleanup();
        
        // Navigate back to user page
        this.$router.push('/user');
        
      } catch (error) {
        console.error('Error leaving room:', error);
        alert('Failed to exit room. Please try again.');
      }
    },

    setupRoomListener() {
      // Subscribe to real-time room updates for basic room data
      this.roomListener = liveSessionService.subscribeToRoomUpdates(this.roomCode, (roomData) => {
        this.handleRoomUpdate(roomData);
      });
      
      // Also subscribe to live session updates for activity data
      this.liveSessionListener = liveSessionService.subscribeToLiveSession(this.roomCode, (liveSessionData) => {
        this.handleLiveSessionUpdate(liveSessionData);
      });
    },

    handleRoomUpdate(roomData) {
      if (!roomData || !roomData.exists) return;

      // Update room data
      this.roomData = roomData.data;
    },

    handleLiveSessionUpdate(liveSessionData) {
      console.log('📊 Student live session update received:', liveSessionData)
      
      if (!liveSessionData || !liveSessionData.exists) {
        console.log('No live session found for room:', this.roomCode);
        return;
      }

      // Update live session data
      this.liveSessionData = liveSessionData.data;
      console.log('Student session status:', this.liveSessionData.status)
      
      // Handle different session states
      switch (this.liveSessionData.status) {
        case 'countdown':
          console.log('🔄 Student switching to countdown state')
          this.handleCountdownStart();
          break;
        case 'active':
          console.log('🔄 Student switching to active state - should redirect to typing test')
          this.handleActivityStart();
          break;
        case 'completed':
          console.log('🔄 Student switching to completed state')
          this.handleActivityEnd();
          break;
        default:
          console.log('🔄 Student unknown session status:', this.liveSessionData.status)
      }
    },

    handleCountdownStart() {
      if (!this.showCountdown && this.liveSessionData && this.liveSessionData.countdownStartedAt) {
        this.showCountdown = true;
        this.startCountdownTimer();
        
        // Show notification
        this.showToast('Activity starting soon! Get ready!', 'success');
      }
    },

    handleActivityStart() {
      this.showCountdown = false;
      this.stopCountdownTimer();
      
      // Show activity start notification
      this.showToast('Activity has started! Begin typing!', 'success');
      
      // Auto-navigate to typing interface or update UI
      this.startTyping();
    },

    handleActivityEnd() {
      this.showCountdown = false;
      this.stopCountdownTimer();
      
      // Show completion notification and redirect to student dashboard
      this.showToast('Activity completed! Redirecting to dashboard...', 'info');
      
      // Redirect to student dashboard after a short delay
      setTimeout(() => {
        this.$router.push('/student-dashboard')
      }, 1500)
    },

    startCountdownTimer() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      const updateCountdown = () => {
        if (!this.liveSessionData || !this.liveSessionData.countdownStartedAt) {
          this.stopCountdownTimer();
          return;
        }

        const now = Date.now();
        // Handle both Firestore Timestamp and Date objects
        let countdownStart;
        if (this.liveSessionData.countdownStartedAt && typeof this.liveSessionData.countdownStartedAt.getTime === 'function') {
          // It's a Date object
          countdownStart = this.liveSessionData.countdownStartedAt.getTime();
        } else if (this.liveSessionData.countdownStartedAt && typeof this.liveSessionData.countdownStartedAt.toMillis === 'function') {
          // It's a Firestore Timestamp
          countdownStart = this.liveSessionData.countdownStartedAt.toMillis();
        } else {
          // Fallback - assume it's already a timestamp number
          countdownStart = this.liveSessionData.countdownStartedAt;
        }
        const countdownDuration = this.liveSessionData.countdownDuration * 1000; // Use dynamic duration from backend
        const elapsed = now - countdownStart;
        const remaining = Math.max(0, countdownDuration - elapsed);

        this.countdownRemaining = Math.ceil(remaining / 1000);

        if (remaining <= 0) {
          this.stopCountdownTimer();
          // Automatically redirect to typing test when countdown ends
          this.handleActivityStart();
        }
      };

      updateCountdown();
      this.countdownInterval = setInterval(updateCountdown, 100);
    },

    stopCountdownTimer() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      this.countdownRemaining = 0;
    },

    cleanup() {
      // Stop polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Stop countdown timer
      this.stopCountdownTimer();

      // Unsubscribe from room listener
      if (this.roomListener) {
        this.roomListener();
        this.roomListener = null;
      }
      
      // Unsubscribe from live session listener
      if (this.liveSessionListener) {
        this.liveSessionListener();
        this.liveSessionListener = null;
      }
    },

    goBack() {
      this.$router.push('/user');
    },

    handleStudentKicked() {
      // Stop polling immediately
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      
      // Show kick notification modal
      this.showKickModal = true;
    },

    async handleKickConfirmation() {
      try {
        // Clear student session from Firestore
        await sessionService.destroyStudentSession();
        
        // Sign out from Firebase Auth
        if (auth.currentUser) {
          await auth.signOut();
        }
        
        // Navigate back to user dashboard
        this.$router.push('/user');
      } catch (error) {
        console.error('Error clearing student session:', error);
        // Navigate anyway to prevent user from being stuck
        this.$router.push('/user');
      }
    },

    showToast(message, type = 'info') {
      const toast = {
        id: Date.now(),
        message,
        type
      }
      
      this.toasts.push(toast)
      
      // Remove toast after 3 seconds
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
.student-room-interface {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1d29 0%, #2d3748 100%);
  color: #ffffff;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #2d3748;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  color: #f56565;
  margin-bottom: 1rem;
}

.room-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.room-header {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.room-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.separator {
  color: var(--border-color);
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status.waiting {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.status.active {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.status.completed {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.student-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
}

.student-details {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: var(--text-primary);
}

.student-status {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.activity-status {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 3rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: var(--text-secondary);
}

.status-icon.active {
  color: #48bb78;
}

.status-icon.completed {
  color: #667eea;
}

.activity-status h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.activity-status p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.activity-controls {
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.progress-section {
  margin-bottom: 2rem;
}

.progress-card {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.progress-card h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.other-students-section {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.other-students-section h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
}

.students-list {
  display: grid;
  gap: 1rem;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.student-item .student-info {
  flex: 1;
}

.student-item .student-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.student-progress {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.student-stats {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.exit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(245, 101, 101, 0.1);
  color: #f56565;
  border: 1px solid rgba(245, 101, 101, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exit-btn:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: rgba(245, 101, 101, 0.5);
  transform: translateY(-1px);
}

.exit-btn svg {
  flex-shrink: 0;
}

/* Kick Modal Styles */
.kick-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.kick-modal {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-color);
}

.kick-modal-header {
  margin-bottom: 24px;
}

.kick-icon {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.kick-modal h2 {
  color: #f56565;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.kick-modal-body {
  margin-bottom: 32px;
}

.kick-modal-body p {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.kick-modal-footer {
  display: flex;
  justify-content: center;
}

/* Countdown Styles */
.countdown-status {
  text-align: center;
  padding: 3rem 2rem;
}

.countdown-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  animation: pulse 1s ease-in-out infinite alternate;
}

.countdown-number {
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
  }
}

.countdown-status h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.countdown-status p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.kick-ok-btn {
  background: #f56565;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kick-ok-btn:hover {
  background: #e53e3e;
  transform: translateY(-1px);
}

.kick-ok-btn:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .room-content {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .progress-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .student-item {
    flex-direction: column;
    text-align: center;
  }
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
</style>