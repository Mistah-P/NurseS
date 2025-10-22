<template>
  <div class="leaderboards">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon">
            <i class="fas fa-heartbeat"></i>
          </div>
          <span class="logo-text">NurseScript</span>
        </div>
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
          <h1 class="page-title">Leaderboards</h1>
        </div>
        <div class="header-right">
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading leaderboard data...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>{{ error }}</p>
          <button @click="loadLeaderboardData" class="retry-btn">
            <i class="fas fa-redo"></i>
            Retry
          </button>
        </div>
        
        <!-- Main Content -->
        <div v-else>
          <!-- Filters and Stats -->
          <div class="controls-section">
          <div class="filter-controls">
            <div class="filter-group">
              <label for="moduleFilter">Filter by Module:</label>
              <select id="moduleFilter" v-model="selectedModule" @change="filterLeaderboard" class="module-select">
                <option value="">All Modules</option>
                <option v-for="module in availableModules" :key="module.value" :value="module.label">
                  {{ module.label }}
                </option>
              </select>
            </div>
            <div class="search-group">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Search students..." 
                  class="search-input"
                >
              </div>
            </div>
          </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ filteredStudents.length }}</span>
              <span class="stat-label">Total Students</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ averageWPM }}</span>
              <span class="stat-label">Average WPM</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-bullseye"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ averageAccuracy }}%</span>
              <span class="stat-label">Average Accuracy</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-medal"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ topPerformerWPM }}</span>
              <span class="stat-label">Top WPM</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="leaderboard-section">
        <div class="section-header">
          <h3>
            <i class="fas fa-list-ol"></i>
            Rankings
            <span class="results-count">({{ filteredStudents.length }} students)</span>
          </h3>
          <div class="sort-controls">
            <select v-model="sortBy" @change="sortLeaderboard" class="sort-select">
              <option value="wpm">Sort by WPM</option>
              <option value="accuracy">Sort by Accuracy</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th class="rank-col">Rank</th>
                <th class="name-col">Student Name</th>
                <th class="section-col">Section</th>
                <th class="module-col">Best Module</th>
                <th class="wpm-col">WPM</th>
                <th class="accuracy-col">Accuracy</th>
                <th class="errors-col">Errors</th>
                <th class="last-active-col">Last Active</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(student, index) in paginatedStudents" 
                :key="student.id"
                class="table-row"
                :class="{ 'top-performer': index < 3 }"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                <td class="rank-col">
                  <div class="rank-badge" :class="`rank-${index + 1}`">
                    <span v-if="index < 3" class="medal">
                      {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                    </span>
                    <span v-else class="rank-number">{{ index + 1 }}</span>
                  </div>
                </td>
                <td class="name-col">
                  <div class="student-info">
                    <div class="student-avatar">
                      <span>{{ (student.displayName || student.studentName) && (student.displayName || student.studentName).charAt ? (student.displayName || student.studentName).charAt(0) : '?' }}</span>
                    </div>
                    <div class="student-details">
                      <div class="student-name">{{ student.displayName || student.studentName || 'Unknown' }}</div>
                      <div class="student-id">{{ student.studentId }}</div>
                    </div>
                  </div>
                </td>
                <td class="section-col">
                  <span class="section-badge" :class="getSectionClass(student.section)">
                    {{ student.section }}
                  </span>
                </td>
                <td class="module-col">
                  <span class="module-badge">{{ student.bestModule }}</span>
                </td>
                <td class="wpm-col">
                  <div class="wpm-display">
                    <span class="wpm-value">{{ student.wpm }}</span>
                    <span class="wpm-label">WPM</span>
                  </div>
                </td>
                <td class="accuracy-col">
                  <div class="accuracy-display">
                    <div class="accuracy-bar">
                      <div class="accuracy-fill" :style="{ width: student.accuracy + '%' }"></div>
                    </div>
                    <span class="accuracy-value">{{ student.accuracy }}%</span>
                  </div>
                </td>
                <td class="errors-col">
                  <div class="errors-display">
                    <span class="errors-value">{{ student.errorsCount || 0 }}</span>
                    <span class="errors-label">errors</span>
                  </div>
                </td>
                <td class="last-active-col">
                  <span class="last-active">{{ formatDate(student.lastActive) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1" 
            @click="currentPage = 1"
          >
            First
          </button>
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1" 
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
          >
            Next
          </button>
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages" 
            @click="currentPage = totalPages"
          >
            Last
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="filteredStudents.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3>No students found</h3>
          <p>Try adjusting your filters or search criteria.</p>
        </div>
        </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { auth } from '../../firebase/init';
import teacherDataService from '../../services/teacherDataService';
import sessionService from '../../services/sessionService';
import moduleService from '../../services/moduleService';
import leaderboardService from '../../services/leaderboardService';

export default {
  name: 'LeaderboardsPage',
  data() {
    return {
      teacherName: '',
      currentUser: null,
      currentSession: null,
      isLoggingOut: false,
      selectedModule: '',
      searchQuery: '',
      sortBy: 'wpm',
      currentPage: 1,
      itemsPerPage: 25,
      availableModules: [], // Will be populated from leaderboardService
      allStudents: [], // Will be populated from leaderboardService
      isLoading: false,
      error: null
    }
  },
  computed: {
    filteredStudents() {
      let filtered = [...this.allStudents]
      
      // Filter by module
      if (this.selectedModule) {
        filtered = filtered.filter(student => student.bestModule === this.selectedModule)
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(student => 
          (student.displayName && student.displayName.toLowerCase().includes(query)) ||
          (student.studentName && student.studentName.toLowerCase().includes(query)) ||
          (student.studentId && student.studentId.toLowerCase().includes(query)) ||
          (student.section && student.section.toLowerCase().includes(query))
        )
      }
      
      // Sort
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'wpm':
            return b.wpm - a.wpm
          case 'accuracy':
            return b.accuracy - a.accuracy
          case 'name':
            return (a.displayName || a.studentName || '').localeCompare(b.displayName || b.studentName || '')
          default:
            return b.wpm - a.wpm
        }
      })
      
      return filtered
    },
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredStudents.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredStudents.length / this.itemsPerPage)
    },
    averageWPM() {
      if (this.filteredStudents.length === 0) return 0
      const total = this.filteredStudents.reduce((sum, student) => sum + student.wpm, 0)
      return Math.round(total / this.filteredStudents.length)
    },
    averageAccuracy() {
      if (this.filteredStudents.length === 0) return 0
      const total = this.filteredStudents.reduce((sum, student) => sum + student.accuracy, 0)
      return Math.round(total / this.filteredStudents.length)
    },
    topPerformerWPM() {
      if (this.filteredStudents.length === 0) return 0
      return Math.max(...this.filteredStudents.map(student => student.wpm))
    }
  },
  methods: {
    async loadLeaderboardData() {
      try {
        this.isLoading = true;
        this.error = null;
        
        // Load available modules for public leaderboard
        this.availableModules = await leaderboardService.getAvailableModules();
        
        // Load student performance data
        await this.loadStudentData();
        
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
        this.error = 'Failed to load leaderboard data';
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadStudentData() {
      try {
        // Load all students data for public leaderboard
        this.allStudents = await leaderboardService.getStudentPerformanceData(
          this.selectedModule === 'All Modules' ? null : this.selectedModule
        );
        
        // No need for applyFilters() - filteredStudents computed property handles filtering automatically
        
      } catch (error) {
        console.error('❌ Error loading student data:', error);
        this.error = 'Failed to load student data. Please try again.';
      }
    },
    
    async filterLeaderboard() {
      // Reload data when module filter changes
      await this.loadStudentData();
      this.currentPage = 1; // Reset to first page
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
    sortLeaderboard() {
      this.currentPage = 1 // Reset to first page when sorting
    },
    getSectionClass(section) {
      const sectionMap = {
        'BSN-1A': 'junior',
        'BSN-1B': 'junior',
        'BSN-2A': 'middle',
        'BSN-2B': 'middle',
        'BSN-3A': 'senior',
        'BSN-3B': 'senior'
      }
      return sectionMap[section] || 'junior'
    },
    formatDate(date) {
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return date.toLocaleDateString()
    },
    exportData() {
      // Create CSV content
      const headers = ['Rank', 'Name', 'Student ID', 'Section', 'Best Module', 'WPM', 'Accuracy', 'Tests Completed', 'Last Active']
      const csvContent = [
        headers.join(','),
        ...this.filteredStudents.map((student, index) => [
          index + 1,
          `"${student.studentName || 'Unknown'}"`,
          student.studentId,
          student.section,
          student.bestModule,
          student.wpm,
          student.accuracy,
          student.testsCompleted,
          student.lastActive.toLocaleDateString()
        ].join(','))
      ].join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard-${this.selectedModule || 'all-modules'}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  },
  mounted() {
    // Initialize services and load data
    try {
      moduleService.initialize();
      
      // Load leaderboard data
      this.loadLeaderboardData();
      
    } catch (error) {
      console.error('Error initializing leaderboard:', error);
      this.error = 'Failed to initialize leaderboard';
    }

    // Subscribe to teacher data changes
    this.unsubscribe = teacherDataService.subscribe((teacherData, isLoading, isInitialized) => {
      if (isInitialized && teacherData) {
        this.teacherName = teacherData.name;
        this.currentSession = teacherData.session;
        this.currentUser = auth.currentUser;
      } else if (isInitialized && !teacherData) {
        this.teacherName = 'Teacher';
      }
    });

    // Get initial data if already loaded
    const teacherData = teacherDataService.getTeacherDataSync();
    if (teacherDataService.isDataLoaded() && teacherData) {
      this.teacherName = teacherData.name;
      this.currentSession = teacherData.session;
      this.currentUser = auth.currentUser;
    } else if (!teacherDataService.isDataLoading()) {
      // If not loading and no data, trigger load
      teacherDataService.getTeacherData().then(() => {
        // Data will be updated via subscription
      });
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

.leaderboards {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'DM Sans', sans-serif;
  color: var(--text-primary);
}

/* Sidebar Styles */
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

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--accent-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-badge {
  background: var(--accent-color);
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 5px;
  font-size: 0.7rem;
  font-weight: 600;
}

.teacher-badge {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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

.nav-item i {
  width: 20px;
  margin-right: 0.75rem;
  font-size: 1rem;
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
  color: var(--text-secondary) !important;
}

.logout-item:hover {
  background: var(--error-color-alpha) !important;
  color: var(--accent-error) !important;
  border-left-color: var(--accent-error) !important;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 280px;
  background: var(--bg-primary);
}

/* Top Header */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn {
  background: var(--accent-gradient);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: var(--text-white);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

/* Dashboard Content */
.dashboard-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Controls Section */
.controls-section {
  margin-bottom: 2rem;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.module-select {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 250px;
}

.search-group {
  flex: 1;
  max-width: 400px;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Leaderboard Section */
.leaderboard-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.results-count {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 0.875rem;
}

.sort-controls {
  display: flex;
  gap: 1rem;
}

.sort-select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th {
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.875rem;
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.table-row:hover {
  background: var(--accent-color-alpha-light);
}

.table-row.top-performer {
  background: var(--gold-color-alpha);
}

.table-row td {
  padding: 1rem;
  vertical-align: middle;
}

/* Rank Column */
.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: 700;
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

.rank-number {
  color: var(--text-secondary);
  font-weight: 600;
}

.medal {
  font-size: 1.25rem;
}

/* Student Info */
.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  font-weight: 600;
  font-size: 1rem;
}

.student-details {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: var(--text-white);
  margin-bottom: 0.25rem;
}

.student-id {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Badges */
.section-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.section-badge.junior {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.section-badge.middle {
  background: var(--warning-color-alpha);
  color: var(--warning-color);
}

.section-badge.senior {
  background: var(--danger-color-alpha);
  color: var(--danger-color);
}

.module-badge {
  background: var(--accent-color-alpha);
  color: var(--accent-color);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* WPM Display */
.wpm-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wpm-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
}

.wpm-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Accuracy Display */
.accuracy-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.accuracy-bar {
  width: 60px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  background: var(--success-gradient);
  transition: width 0.3s ease;
}

.accuracy-value {
  font-weight: 600;
  color: var(--success-color);
  min-width: 40px;
}

/* Errors Display */
.errors-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.errors-value {
  font-weight: 700;
  color: var(--error-color);
  font-size: 1.1rem;
}

.errors-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Score */
.score-value {
  font-weight: 700;
  color: var(--warning-color);
}

/* Tests Count */
.tests-count {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Last Active */
.last-active {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-white);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-quaternary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.error-state p {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  background: var(--accent-gradient);
  color: var(--text-white);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--text-white);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
}

/* Animations */
@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
  
  .sidebar {
    transform: translateX(-100%);
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .module-select {
    min-width: auto;
    width: 100%;
  }
  
  .search-group {
    max-width: none;
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .table-container {
    font-size: 0.875rem;
  }
  
  .leaderboard-table th,
  .leaderboard-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>