<template>
  <div class="live-leaderboard">
    <!-- Header -->
    <header class="leaderboard-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          Back to Room
        </button>
        <div class="room-info">
          <h1>Live Leaderboard</h1>
          <p>Room: {{ roomCode }} • {{ activityName }}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="activity-timer" v-if="activityDuration > 0">
          <i class="fas fa-clock"></i>
          {{ formatDuration(activityDuration) }}
        </div>
        <button @click="endActivity" class="end-activity-btn" :disabled="isEndingActivity">
          <i class="fas fa-stop"></i>
          End Activity
        </button>
      </div>
    </header>

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
            <div class="metric-value">{{ student.wpm }}</div>
            <div class="metric-label">WPM</div>
          </div>
          <div class="accuracy-col">
            <div class="metric-value">{{ student.accuracy }}%</div>
            <div class="metric-label">Accuracy</div>
          </div>
          <div class="status-col">
            <span class="status-badge" :class="student.status">
              {{ getStatusLabel(student.status) }}
            </span>
          </div>
        </div>

        <div v-if="leaderboard.length === 0" class="empty-leaderboard">
          <i class="fas fa-users"></i>
          <p>No students have started typing yet</p>
        </div>
      </div>
    </div>

    <!-- Activity Stats -->
    <div class="activity-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalStudents }}</div>
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
</template>

<script>
import liveSessionService from '../../services/liveSessionService'

export default {
  name: 'LiveLeaderboard',
  data() {
    return {
      roomCode: this.$route.params.roomCode,
      liveSessionData: null,
      leaderboard: [],
      activityDuration: 0,
      countdownRemaining: 0,
      isEndingActivity: false,
      // Listeners
      liveSessionListener: null,
      leaderboardListener: null,
      countdownInterval: null,
      durationInterval: null
    }
  },
  computed: {
    activityName() {
      return this.liveSessionData?.moduleContent || 'Typing Activity'
    },
    totalStudents() {
      return this.leaderboard.length
    },
    activeStudents() {
      return this.leaderboard.filter(s => s.status === 'typing').length
    },
    completedStudents() {
      return this.leaderboard.filter(s => s.status === 'completed').length
    },
    averageWPM() {
      if (this.leaderboard.length === 0) return 0
      const totalWPM = this.leaderboard.reduce((sum, s) => sum + s.wpm, 0)
      return Math.round(totalWPM / this.leaderboard.length)
    }
  },
  async mounted() {
    await this.setupLiveSession()
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    async setupLiveSession() {
      try {
        // Subscribe to live session updates
        this.liveSessionListener = liveSessionService.subscribeToLiveSession(
          this.roomCode,
          this.handleLiveSessionUpdate
        )

        // Subscribe to leaderboard updates
        this.leaderboardListener = liveSessionService.subscribeToLeaderboard(
          this.roomCode,
          this.handleLeaderboardUpdate
        )

      } catch (error) {
        console.error('Error setting up live session:', error)
        this.$toast.error('Failed to connect to live session')
      }
    },

    handleLiveSessionUpdate(update) {
      if (update.exists && update.data) {
        this.liveSessionData = update.data
        
        // Handle different session states
        switch (update.data.status) {
          case 'countdown':
            this.handleCountdownState()
            break
          case 'active':
            this.handleActiveState()
            break
          case 'completed':
            this.handleCompletedState()
            break
        }
      }
    },

    handleLeaderboardUpdate(leaderboardData) {
      this.leaderboard = leaderboardData || []
    },

    handleCountdownState() {
      if (!this.countdownInterval) {
        this.startCountdownTimer()
      }
    },

    handleActiveState() {
      this.stopCountdownTimer()
      if (!this.durationInterval) {
        this.startDurationTimer()
      }
    },

    handleCompletedState() {
      this.stopCountdownTimer()
      this.stopDurationTimer()
      this.$toast.success('Activity completed!')
    },

    startCountdownTimer() {
      if (!this.liveSessionData) return
      
      this.countdownInterval = setInterval(() => {
        const remaining = liveSessionService.getCountdownRemaining(
          this.liveSessionData.countdownStartedAt,
          this.liveSessionData.countdownDuration
        )
        
        this.countdownRemaining = remaining
        
        if (remaining <= 0) {
          this.stopCountdownTimer()
        }
      }, 1000)
    },

    stopCountdownTimer() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
        this.countdownRemaining = 0
      }
    },

    startDurationTimer() {
      this.durationInterval = setInterval(() => {
        this.activityDuration++
      }, 1000)
    },

    stopDurationTimer() {
      if (this.durationInterval) {
        clearInterval(this.durationInterval)
        this.durationInterval = null
      }
    },

    async endActivity() {
      if (this.isEndingActivity) return
      
      this.isEndingActivity = true
      
      try {
        const result = await liveSessionService.endActivity(this.roomCode)
        
        if (result.success) {
          this.$toast.success('Activity ended successfully!')
          // Stay on leaderboard to show final results
        } else {
          throw new Error(result.message || 'Failed to end activity')
        }
      } catch (error) {
        console.error('Error ending activity:', error)
        this.$toast.error(error.message || 'Failed to end activity')
      } finally {
        this.isEndingActivity = false
      }
    },

    goBack() {
      this.$router.push(`/room/${this.roomCode}`)
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
    },

    cleanup() {
      this.stopCountdownTimer()
      this.stopDurationTimer()
      
      if (this.liveSessionListener) {
        this.liveSessionListener()
        this.liveSessionListener = null
      }
      
      if (this.leaderboardListener) {
        this.leaderboardListener()
        this.leaderboardListener = null
      }
    }
  }
}
</script>

<style scoped>
.live-leaderboard {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 2rem;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  background: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-primary);
}

.back-btn:hover {
  background: var(--bg-secondary);
}

.room-info h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.room-info p {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.activity-timer {
  background: var(--accent-gradient-alpha);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.end-activity-btn {
  background: var(--danger-gradient);
  border: none;
  color: var(--text-white);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.end-activity-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-danger);
}

.end-activity-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activity-status {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.countdown-status .countdown-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.countdown-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-white);
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
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.status-indicator.completed {
  background: var(--accent-color-alpha);
  color: var(--accent-color);
}

.leaderboard-container {
  background: var(--bg-secondary-alpha);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.leaderboard-header-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-tertiary-alpha);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.leaderboard-body {
  max-height: 500px;
  overflow-y: auto;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color-alpha);
  transition: all 0.3s ease;
}

.leaderboard-row:hover {
  background: var(--bg-secondary-alpha);
}

.leaderboard-row.top-performer {
  background: var(--gold-color-alpha);
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.rank-badge.gold {
  background: var(--gold-gradient);
  color: var(--text-dark);
}

.rank-badge.silver {
  background: var(--silver-gradient);
  color: var(--text-dark);
}

.rank-badge.bronze {
  background: var(--bronze-gradient);
  color: var(--text-white);
}

.rank-badge:not(.gold):not(.silver):not(.bronze) {
  background: var(--bg-tertiary-alpha);
  color: var(--text-white);
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-white);
}

.student-name {
  font-weight: 600;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-white);
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary-alpha);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: var(--success-gradient);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.ready {
  background: var(--warning-color-alpha);
  color: var(--warning-color);
}

.status-badge.typing {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.status-badge.completed {
  background: var(--accent-color-alpha);
  color: var(--accent-color);
}

.empty-leaderboard {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-leaderboard i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.activity-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--bg-secondary-alpha);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-white);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>