<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="room-info">
            <h3>Live Leaderboard</h3>
            <p>Room: {{ roomCode }} • {{ activityName }}</p>
          </div>
        </div>
        <div class="header-right">
          <button @click="closeModalWithRefresh" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Activity Status -->
        <div class="activity-status">
          <div v-if="liveSessionData?.status === 'active'" class="active-status">
            <div class="status-indicator active">
              <i class="fas fa-play"></i>
              <span>Activity Active</span>
            </div>
            <p>{{ leaderboard.length }} students participating</p>
          </div>

          <div v-else-if="liveSessionData?.status === 'completed'" class="completed-status">
            <div class="status-indicator completed">
              <i class="fas fa-check"></i>
              <span>Activity Completed</span>
            </div>
            <p>Final results displayed below</p>
          </div>

          <div v-else-if="liveSessionData?.status === 'countdown'" class="preparing-status">
            <div class="status-indicator preparing">
              <i class="fas fa-clock"></i>
              <span>Preparing Activity</span>
            </div>
            <p>Students are getting ready to start...</p>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="leaderboard-container">
          <div class="leaderboard-header-row">
            <div class="rank-col">Rank</div>
            <div class="student-col">Student</div>
            <div class="wpm-col">WPM</div>
            <div class="accuracy-col">Accuracy</div>
            <div class="errors-col">Errors</div>
            <div class="status-col">Status</div>
          </div>

          <div class="leaderboard-body">
            <div 
              v-for="(student, index) in leaderboard" 
              :key="student.studentId"
              class="leaderboard-row"
              :class="{ 'top-performer': index < 3 }"
            >
              <div class="rank-col">
                <div class="rank-badge" :class="getRankClass(index + 1)">
                  <i v-if="index === 0" class="fas fa-crown"></i>
                  <i v-else-if="index === 1" class="fas fa-medal"></i>
                  <i v-else-if="index === 2" class="fas fa-award"></i>
                  <span v-else>{{ index + 1 }}</span>
                </div>
              </div>
              <div class="student-col">
                <div class="student-info">
                  <div class="student-avatar">
                    {{ student.studentName.charAt(0) }}
                  </div>
                  <span class="student-name">{{ student.studentName }}</span>
                </div>
              </div>
              <div class="wpm-col">
                <span class="wpm-value">{{ student.wpm }}</span>
              </div>
              <div class="accuracy-col">
                <span class="accuracy-value">{{ student.accuracy }}%</span>
              </div>
              <div class="errors-col">
                <span class="errors-value">{{ student.errorsCount || 0 }}</span>
              </div>
              <div class="status-col">
                <span class="status-badge" :class="student.status">
                  {{ getStatusLabel(student.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ leaderboard.length }}</div>
              <div class="stat-label">Total Students</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-keyboard"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ activeStudents }}</div>
              <div class="stat-label">Currently Typing</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ completedStudents }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ averageWPM }}</div>
              <div class="stat-label">Avg WPM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import liveSessionService from '../../services/liveSessionService'

export default {
  name: 'LiveLeaderboardModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    roomCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      liveSessionData: null,
      leaderboard: [],
      activityDuration: 0,
      isEndingActivity: false,
      // Listeners
      liveSessionListener: null,
      leaderboardListener: null,
      durationInterval: null
    }
  },
  computed: {
    activityName() {
      return this.liveSessionData?.activityName || 'Typing Competition'
    },
    activeStudents() {
      return this.leaderboard.filter(student => student.status === 'typing').length
    },
    completedStudents() {
      return this.leaderboard.filter(student => student.status === 'completed').length
    },
    averageWPM() {
      if (this.leaderboard.length === 0) return 0
      const totalWPM = this.leaderboard.reduce((sum, student) => sum + student.wpm, 0)
      return Math.round(totalWPM / this.leaderboard.length)
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.initializeModal()
      } else {
        this.cleanup()
      }
    }
  },
  methods: {
    async initializeModal() {
      try {
        // Load initial data
        await this.loadLiveSessionData()
        
        // Set up real-time listeners
        this.setupLiveSessionListener()
        this.setupLeaderboardListener()
        
        // Start duration timer if activity is active
        if (this.isActivityActive) {
          this.startDurationTimer()
        }
      } catch (error) {
        console.error('Error initializing modal:', error)
      }
    },
    
    async loadLiveSessionData() {
      try {
        const result = await liveSessionService.getLiveSession(this.roomCode)
        
        if (result.success) {
          this.liveSessionData = result.data
          
          // Process leaderboard data
          if (result.data.leaderboard) {
            this.leaderboard = result.data.leaderboard.map(student => ({
              ...student,
              rank: student.rank || 0,
              wpm: student.wpm || 0,
              accuracy: student.accuracy || 0,
              progress: student.progress || 0,
              status: student.status || 'waiting'
            }))
          }
        }
      } catch (error) {
        console.error('Error loading live session data:', error)
      }
    },
    
    setupLiveSessionListener() {
      if (this.liveSessionUnsubscribe) {
        this.liveSessionUnsubscribe()
      }
      
      this.liveSessionUnsubscribe = liveSessionService.subscribeToLiveSession(
        this.roomCode,
        (liveSessionData) => {
          this.liveSessionData = liveSessionData
          
          // Handle status changes
          if (liveSessionData.status === 'completed') {
            this.stopDurationTimer()
          } else if (liveSessionData.status === 'active' && !this.durationTimer) {
            this.startDurationTimer()
          }
        }
      )
    },
    
    setupLeaderboardListener() {
      if (this.leaderboardUnsubscribe) {
        this.leaderboardUnsubscribe()
      }
      
      this.leaderboardUnsubscribe = liveSessionService.subscribeToLeaderboard(
        this.roomCode,
        (leaderboardData) => {
          this.leaderboard = leaderboardData
        }
      )
    },
    
    startDurationTimer() {
      if (this.durationTimer) return
      
      this.durationTimer = setInterval(() => {
        this.currentDuration++
      }, 1000)
    },
    
    stopDurationTimer() {
      if (this.durationTimer) {
        clearInterval(this.durationTimer)
        this.durationTimer = null
      }
    },

    async endActivity() {
      if (this.isEndingActivity) return
      
      this.isEndingActivity = true
      
      try {
        const result = await liveSessionService.endActivity(this.roomCode)
        
        if (result.success) {
          this.$emit('activity-ended')
          this.$emit('toast', { message: 'Activity ended successfully!', type: 'success' })
        } else {
          throw new Error(result.message || 'Failed to end activity')
        }
      } catch (error) {
        console.error('Error ending activity:', error)
        this.$emit('toast', { message: error.message || 'Failed to end activity', type: 'error' })
      } finally {
        this.isEndingActivity = false
      }
    },

    closeModal() {
      this.$emit('close')
    },

    closeModalWithRefresh() {
      // Just close the modal without refreshing the page
      // Real-time listeners will handle updates automatically
      this.$emit('close')
    },

    handleOverlayClick() {
      // Close modal when clicking overlay
      this.closeModalWithRefresh()
    },

    cleanup() {
      // Stop listeners
      if (this.liveSessionListener) {
        this.liveSessionListener()
        this.liveSessionListener = null
      }
      
      if (this.leaderboardListener) {
        this.leaderboardListener()
        this.leaderboardListener = null
      }
      
      // Stop timers
      this.stopDurationTimer()
    },

    getRankClass(rank) {
      if (rank === 1) return 'gold'
      if (rank === 2) return 'silver'
      if (rank === 3) return 'bronze'
      return ''
    },

    getStatusLabel(status) {
      const labels = {
        'ready': 'Ready',
        'typing': 'Typing',
        'completed': 'Completed'
      }
      return labels[status] || status
    },

    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  },

  beforeUnmount() {
    this.cleanup()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-container {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  max-height: 90vh;
  width: 1200px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.modal-header {
  background: var(--bg-tertiary);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.room-info h3, .room-info h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.room-info p {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.activity-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #68d391;
  font-weight: 600;
  font-size: 0.875rem;
}

.close-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.end-activity-btn {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  border: none;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.end-activity-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
}

.end-activity-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-content {
  padding: 1.5rem;
  max-height: calc(90vh - 100px);
  overflow-y: auto;
  color: var(--text-primary);
}

.activity-status {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-indicator.active {
  background: rgba(72, 187, 120, 0.2);
  color: #68d391;
}

.status-indicator.completed {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.status-indicator.preparing {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.leaderboard-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.leaderboard-header-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 120px 100px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.leaderboard-body {
  max-height: 400px;
  overflow-y: auto;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 120px 100px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: background-color 0.2s ease;
}

.leaderboard-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.leaderboard-row.top-performer {
  background: rgba(255, 215, 0, 0.1);
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #744210;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #e2e8f0 100%);
  color: #2d3748;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #d69e2e 100%);
  color: #744210;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-inverse);
  font-size: 0.875rem;
}

.student-name {
  font-weight: 500;
  color: var(--text-primary);
}

.wpm-value, .accuracy-value {
  font-weight: 600;
  color: #68d391;
}

.errors-value {
  font-weight: 600;
  color: #f56565;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #68d391 0%, #38b2ac 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.ready {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.status-badge.typing {
  background: rgba(72, 187, 120, 0.2);
  color: #68d391;
}

.status-badge.completed {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: 1.25rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar,
.leaderboard-body::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track,
.leaderboard-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb,
.leaderboard-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.leaderboard-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>