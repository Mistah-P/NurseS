<template>
  <div class="typing-history">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="logo">NurseScript</h2>
        <span class="teacher-badge">{{ teacherName || 'Teacher' }}</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/teacher-dashboard" class="nav-item" active-class="active">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/typing-history" class="nav-item" active-class="active">
          <i class="fas fa-history"></i>
          <span>Typing History</span>
        </router-link>
        <router-link to="/leaderboards" class="nav-item" active-class="active">
          <i class="fas fa-trophy"></i>
          <span>Leaderboards</span>
        </router-link>
        <router-link to="/teacher-settings" class="nav-item" active-class="active">
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </router-link>
        <div class="nav-divider"></div>
        <a href="#" class="nav-item logout-item" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Log out</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Typing History</h1>
          <p class="page-subtitle">View and analyze previous typing activities</p>
        </div>
        <div class="header-right">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search activities..." 
              v-model="searchQuery"
              class="search-input"
            >
          </div>
          <div class="filter-dropdown">
            <select v-model="selectedSection" class="filter-select">
              <option value="">All Sections</option>
              <option v-for="section in sections" :key="section" :value="section">
                {{ section }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <!-- History Content -->
      <div class="history-content">
        <div class="history-stats">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalActivities }}</span>
              <span class="stat-label">Total Activities</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ totalParticipants }}</span>
              <span class="stat-label">Total Participants</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-calendar-week"></i>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ thisWeekActivities }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </div>
        </div>

        <!-- Activities Table -->
        <div class="table-container">
          <div class="table-header">
            <h3>Activity Records</h3>
            <div class="table-actions">
              <button class="btn btn-secondary" @click="exportData">
                <i class="fas fa-download"></i>
                Export
              </button>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="activities-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" class="sortable">
                    Activity Name
                    <i class="fas fa-sort" :class="getSortIcon('name')"></i>
                  </th>
                  <th @click="sortBy('section')" class="sortable">
                    Section
                    <i class="fas fa-sort" :class="getSortIcon('section')"></i>
                  </th>
                  <th @click="sortBy('date')" class="sortable">
                    Date
                    <i class="fas fa-sort" :class="getSortIcon('date')"></i>
                  </th>
                  <th>Participants</th>
                  <th>Game Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(activity, index) in filteredActivities" 
                  :key="activity.id"
                  class="table-row"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <td class="activity-name">
                    <div class="activity-info">
                      <div class="activity-icon">
                        <i class="fas fa-keyboard"></i>
                      </div>
                      <div class="activity-details">
                        <span class="name">{{ activity.name }}</span>
                        <span class="difficulty">{{ activity.difficulty }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="section">
                    <span class="section-badge" :class="getSectionClass(activity.section)">
                      {{ activity.section }}
                    </span>
                  </td>
                  <td class="date">
                    <div class="date-info">
                      <span class="date-text">{{ formatDate(activity.date) }}</span>
                      <span class="time-text">{{ formatTime(activity.date) }}</span>
                    </div>
                  </td>
                  <td class="participants">
                    <div class="participant-count">
                      <i class="fas fa-users"></i>
                      <span>{{ activity.participants }}</span>
                    </div>
                  </td>
                  <td class="game-mode">
                    <span class="game-mode-badge" :class="getGameModeClass(activity.gameMode)">
                      {{ activity.gameMode }}
                    </span>
                  </td>
                  <td class="actions">
                    <button 
                      class="btn btn-primary btn-sm view-btn" 
                      @click="viewLeaderboard(activity)"
                    >
                      <i class="fas fa-eye"></i>
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Empty State -->
            <div v-if="filteredActivities.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-history"></i>
              </div>
              <h3>No Activities Found</h3>
              <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'No typing activities have been created yet' }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Leaderboard Modal -->
    <LeaderboardModal 
      :show="showLeaderboardModal" 
      :activity="selectedActivity"
      @close="showLeaderboardModal = false"
    />
  </div>
</template>

<script>
import LeaderboardModal from './LeaderboardModal.vue'
import { auth } from '../../firebase/init';
import teacherDataService from '../../services/teacherDataService';
import sessionService from '../../services/sessionService';
import activityService from '../../services/activityService';

export default {
  name: 'TypingHistory',
  components: {
    LeaderboardModal
  },
  data() {
    return {
      teacherName: '',
      currentUser: null,
      currentSession: null,
      isLoggingOut: false,
      searchQuery: '',
      selectedSection: '',
      sortField: 'date',
      sortDirection: 'desc',
      showLeaderboardModal: false,
      selectedActivity: null,
      sections: ['BSN-1A', 'BSN-1B', 'BSN-2A', 'BSN-2B', 'BSN-3A', 'BSN-3B'],
      activities: [],
      isLoading: false
    }
  },
  computed: {
    filteredActivities() {
      let filtered = this.activities

      // Filter by search query
      if (this.searchQuery) {
        filtered = filtered.filter(activity =>
          activity.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          activity.section.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      }

      // Filter by section
      if (this.selectedSection) {
        filtered = filtered.filter(activity => activity.section === this.selectedSection)
      }

      // Sort
      filtered.sort((a, b) => {
        let aVal = a[this.sortField]
        let bVal = b[this.sortField]

        if (this.sortField === 'date') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }

        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      return filtered
    },
    totalActivities() {
      return this.activities.length
    },
    totalParticipants() {
      return this.activities.reduce((sum, activity) => sum + activity.participants, 0)
    },
    thisWeekActivities() {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return this.activities.filter(activity => new Date(activity.date) >= oneWeekAgo).length
    }
  },
  async mounted() {
    try {
      // Subscribe to teacher data changes
      this.unsubscribeTeacherData = teacherDataService.subscribe((teacherData, isLoading, isInitialized) => {
        if (isInitialized && teacherData) {
          this.teacherName = teacherData.name;
          this.currentSession = teacherData.session;
          this.currentUser = auth.currentUser;
          this.loadActivities(teacherData.id);
        } else if (isInitialized && !teacherData) {
          this.teacherName = 'Teacher';
        }
      });

      // Get initial data if already loaded (same pattern as Leaderboards.vue)
      const teacherData = teacherDataService.getTeacherDataSync();
      if (teacherDataService.isDataLoaded() && teacherData) {
        this.teacherName = teacherData.name;
        this.currentSession = teacherData.session;
        this.currentUser = auth.currentUser;
        this.loadActivities(teacherData.id);
      } else if (!teacherDataService.isDataLoading()) {
        // If not loading and no data, trigger load
        teacherDataService.getTeacherData().then((data) => {
          if (data) {
            this.loadActivities(data.id);
          }
        });
      }
    } catch (error) {
      console.error('Error in TypingHistory mounted:', error);
    }
  },
  
  methods: {
    async loadActivities(teacherId) {
      if (!teacherId) {
        return;
      }
      
      try {
        this.isLoading = true;
        
        const activities = await activityService.getTeacherActivities(teacherId);
        
        this.activities = activities;
        
        this.isLoading = false;
      } catch (error) {
        console.error('Error loading activities:', error);
        this.isLoading = false;
      }
    },
    getGameModeClass(gameMode) {
      return {
        'timed-mode': gameMode === 'Timed',
        'word-count-mode': gameMode === 'Word Count Challenge'
      }
    },
    async logout() {
      // Prevent multiple simultaneous logout attempts
      if (this.isLoggingOut) {
        return;
      }
      
      this.isLoggingOut = true;
      
      try {
        // Navigate immediately for better UX
        this.$router.replace('/');
        
        // Perform cleanup operations in background
        Promise.all([
          sessionService.destroyTeacherSession(),
          auth.currentUser ? auth.signOut() : Promise.resolve()
        ]).catch(error => {
          console.error('Background logout cleanup error:', error);
        });
        
      } catch (error) {
        console.error('Error during logout:', error);
        // Still redirect to home even if logout fails
        this.$router.replace('/');
      } finally {
        this.isLoggingOut = false;
      }
    },
    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDirection = 'asc'
      }
    },
    getSortIcon(field) {
      if (this.sortField !== field) return ''
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
    },
    getSectionClass(section) {
      const year = section.charAt(4)
      return {
        'year-1': year === '1',
        'year-2': year === '2',
        'year-3': year === '3'
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    formatTime(date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    viewLeaderboard(activity) {
      this.selectedActivity = activity
      this.showLeaderboardModal = true
    },
    exportData() {
      // Export functionality would be implemented here
      console.log('Exporting data...')
    }
  },
  beforeUnmount() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.typing-history {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'DM Sans', sans-serif;
  color: var(--text-primary);
}

/* Sidebar Styles (Same as TeacherDashboard) */
.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.logo {
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.teacher-badge {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--accent-gradient-alpha);
  color: var(--accent-primary);
  border-left-color: var(--accent-primary);
}

.nav-item.active {
  background: var(--accent-gradient-alpha);
  color: var(--accent-primary);
  border-left-color: var(--accent-primary);
}

.nav-divider {
  height: 1px;
  background: var(--border-primary);
  margin: 1rem 1.5rem;
}

.logout-item {
  margin-top: auto;
  border-top: 1px solid var(--border-primary);
  padding-top: 1rem;
}

.nav-item i {
  width: 20px;
  margin-right: 0.75rem;
  font-size: 1rem;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 280px;
  background: var(--bg-primary);
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid #2d3748;
}

.page-title {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
  z-index: 1;
}

.search-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  width: 250px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-alpha);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.filter-select {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* History Content */
.history-content {
  padding: 2rem;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: var(--accent-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

/* Table Styles */
.table-container {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.table-header h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.8rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--accent-gradient);
  color: white;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn:hover {
  transform: translateY(-1px);
}

.table-wrapper {
  overflow-x: auto;
}

.activities-table {
  width: 100%;
  border-collapse: collapse;
}

.activities-table th {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.activities-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.activities-table th.sortable:hover {
  background: var(--bg-secondary);
}

.activities-table th i {
  margin-left: 0.5rem;
  opacity: 0.5;
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

.table-row:hover {
  background: var(--accent-color-alpha);
}

.activities-table td {
  padding: 1.5rem;
  vertical-align: middle;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
}

.activity-details .name {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-details .difficulty {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.section-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.section-badge.year-1 {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.section-badge.year-2 {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.section-badge.year-3 {
  background: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

.date-info .date-text {
  display: block;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.date-info .time-text {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.participant-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.game-mode-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.game-mode-badge.timed-mode {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.game-mode-badge.word-count-mode {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.view-btn {
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--text-secondary);
  font-size: 2rem;
}

.empty-state h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-item {
  animation: fadeInUp 0.6s ease-out;
}

.stat-item:nth-child(2) {
  animation-delay: 0.1s;
}

.stat-item:nth-child(3) {
  animation-delay: 0.2s;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  
  .main-content {
    margin-left: 70px;
  }
  
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 1rem 0.75rem;
  }
  
  .top-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: 200px;
  }
  
  .history-stats {
    grid-template-columns: 1fr;
  }
  
  .table-wrapper {
    overflow-x: scroll;
  }
  
  .activities-table {
    min-width: 800px;
  }
}
</style>