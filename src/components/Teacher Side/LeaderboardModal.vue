<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="activity-info">
            <h2 class="activity-title">{{ activity.name }}</h2>
            <div class="activity-meta">
              <span class="section-badge">{{ activity.section }}</span>
              <span class="date-badge">{{ formatDate(activity.date) }}</span>
            </div>
          </div>
          <button @click="closeModal" class="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Leaderboard Stats -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M20 8V14L17 11L20 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ leaderboardData.length }}</span>
            <span class="stat-label">Participants</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ averageWPM }}</span>
            <span class="stat-label">Avg WPM</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ averageAccuracy }}%</span>
            <span class="stat-label">Avg Accuracy</span>
          </div>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="leaderboard-section">
        <div class="section-header">
          <h3>Leaderboard Rankings</h3>
          <div class="filter-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="wpm">Sort by WPM</option>
              <option value="accuracy">Sort by Accuracy</option>
            </select>
          </div>
        </div>

        <div class="leaderboard-table">
          <div class="table-header">
            <div class="rank-col">Rank</div>
            <div class="name-col">Student Name</div>
            <div class="wpm-col">WPM</div>
            <div class="accuracy-col">Accuracy</div>
            <div class="errors-col">Errors</div>
            <div class="status-col">Status</div>
          </div>
          
          <div class="table-body">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <span>Loading leaderboard data...</span>
            </div>
            
            <!-- Empty State -->
            <div v-else-if="leaderboardData.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>No leaderboard data available</span>
            </div>
            
            <!-- Leaderboard Data -->
            <div 
              v-else
              v-for="(student, index) in sortedLeaderboard" 
              :key="student.id"
              class="table-row"
              :class="{ 'top-performer': index < 3 }"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="rank-col">
                <div class="rank-badge" :class="`rank-${index + 1}`">
                  <span v-if="index < 3" class="medal">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
              </div>
              <div class="name-col">
                <div class="student-info">
                  <div class="avatar">{{ student.name.charAt(0) }}</div>
                  <span class="name">{{ student.name }}</span>
                </div>
              </div>
              <div class="wpm-col">
                <span class="wpm-value">{{ student.wpm }}</span>
              </div>
              <div class="accuracy-col">
                <div class="accuracy-bar">
                  <div class="accuracy-fill" :style="{ width: `${student.accuracy}%` }"></div>
                  <span class="accuracy-text">{{ student.accuracy }}%</span>
                </div>
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
      </div>

      <!-- Modal Actions -->
      <div class="modal-actions">
        <button @click="exportData" class="export-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Export Results
        </button>
        <button @click="closeModal" class="close-action-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import activityService from '../../services/activityService';

export default {
  name: 'LeaderboardModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    activity: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      sortBy: 'wpm',
      leaderboardData: [],
      isLoading: false
    }
  },
  computed: {
    sortedLeaderboard() {
      const sorted = [...this.leaderboardData].sort((a, b) => {
        switch (this.sortBy) {
          case 'wpm':
            return b.wpm - a.wpm
          case 'accuracy':
            return b.accuracy - a.accuracy
          default:
            return b.wpm - a.wpm
        }
      })
      return sorted
    },
    averageWPM() {
      if (this.leaderboardData.length === 0) return 0;
      const total = this.leaderboardData.reduce((sum, student) => sum + student.wpm, 0)
      return Math.round(total / this.leaderboardData.length)
    },
    averageAccuracy() {
      if (this.leaderboardData.length === 0) return 0;
      const total = this.leaderboardData.reduce((sum, student) => sum + student.accuracy, 0)
      return Math.round(total / this.leaderboardData.length)
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        document.body.style.overflow = 'hidden'
        this.loadLeaderboardData()
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  methods: {
    async loadLeaderboardData() {
      if (!this.activity || !this.activity.roomCode) {
        console.warn('No room code available for leaderboard data');
        return;
      }

      this.isLoading = true;
      try {
        const leaderboardData = await activityService.getActivityLeaderboard(this.activity.roomCode);
        this.leaderboardData = leaderboardData;
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
        // Keep leaderboardData as empty array on error
        this.leaderboardData = [];
      } finally {
        this.isLoading = false;
      }
    },
    closeModal() {
      this.$emit('close')
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    getStatusLabel(status) {
      const statusLabels = {
        'ready': 'Ready',
        'typing': 'Typing',
        'completed': 'Completed'
      }
      return statusLabels[status] || status
    },
    exportData() {
      // Export functionality
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: var(--bg-secondary);
  border-radius: 20px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s ease-out;
  border: 1px solid var(--border-primary);
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-tertiary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.activity-info h2 {
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.activity-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-badge {
  background: var(--accent-gradient);
  color: var(--text-white);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.date-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
}

.close-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  transform: scale(1.05);
}

.stats-section {
  padding: 24px 32px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
}

.stat-card {
  background: var(--bg-gradient);
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent-light);
}

.stat-icon {
  background: var(--accent-gradient);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  line-height: 1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  margin-top: 4px;
}

.leaderboard-section {
  padding: 24px 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.sort-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 8px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.leaderboard-table {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 80px 120px 80px 120px;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'DM Sans', sans-serif;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px 120px 80px 120px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  transition: all 0.3s ease;
  animation: slideInLeft 0.5s ease-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.table-row:hover {
  background: var(--accent-color-alpha);
}

.table-row.top-performer {
  background: var(--accent-gradient-alpha);
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
}

.rank-badge.rank-1 {
  background: var(--gold-gradient);
  color: var(--text-dark);
}

.rank-badge.rank-2 {
  background: var(--silver-gradient);
  color: var(--text-dark);
}

.rank-badge.rank-3 {
  background: var(--bronze-gradient);
  color: var(--text-white);
}

.medal {
  font-size: 16px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  font-weight: 600;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
}

.name {
  color: var(--text-primary);
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
}

.wpm-value {
  color: var(--success-color);
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.accuracy-bar {
  position: relative;
  background: var(--bg-tertiary);
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  background: var(--success-gradient);
  transition: width 0.8s ease;
  border-radius: 10px;
}

.accuracy-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-white);
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.score-value {
  color: var(--accent-color);
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.modal-actions {
  padding: 24px 32px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--bg-tertiary);
}

.export-btn {
  background: var(--accent-gradient);
  color: var(--text-white);
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

.close-action-btn {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 12px 20px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.errors-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.errors-value {
  color: var(--text-primary);
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.status-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.ready {
  background: var(--accent-color-alpha);
  color: var(--accent-color);
}

.status-badge.typing {
  background: var(--warning-color-alpha);
  color: var(--warning-color);
}

.status-badge.completed {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-family: 'DM Sans', sans-serif;
}

.loading-state span,
.empty-state span {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--bg-secondary);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state svg {
  color: var(--text-tertiary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }

  .modal-header,
  .stats-section,
  .leaderboard-section,
  .modal-actions {
    padding: 16px 20px;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 60px 1fr 60px 80px 80px;
    gap: 8px;
    padding: 12px 16px;
    font-size: 12px;
  }

  .student-info {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>