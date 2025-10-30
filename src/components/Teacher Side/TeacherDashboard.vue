<template>
  <div class="teacher-dashboard">
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
          <span>Activity History</span>
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
          <h1 class="page-title">Dashboard</h1>
        </div>
        <div class="header-right">
          <button class="btn btn-secondary add-students-btn" @click="showAddStudentsModal = true">
            <i class="fas fa-user-plus"></i>
            Add Students
          </button>
          <button class="btn btn-primary create-room-btn" @click="showCreateRoomModal = true">
            <i class="fas fa-plus"></i>
            Create Room
          </button>
          <div class="user-profile">
            <div class="user-info">
              <span class="user-name">{{ teacherName }}</span>
              <span class="user-email">{{ teacherEmail }}</span>
            </div>
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Top Row - Main Stats -->
        <div class="stats-grid">
          <!-- Cards removed as requested -->
        </div>

        <!-- Second Row -->
        <div class="content-grid">
          <!-- Student List -->
          <div class="card student-list-card">
            <div class="card-header">
              <h3>My Students ({{ studentList.length }})</h3>
              <div class="header-actions">
                <button class="btn-link" @click="refreshStudentList" :disabled="loadingStudentList">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingStudentList }"></i>
                </button>
              </div>
            </div>
            
            <!-- Loading State -->
            <div v-if="loadingStudentList" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading student list...</p>
            </div>
            
            <!-- Empty State -->
            <div v-else-if="studentList.length === 0" class="empty-state">
              <i class="fas fa-users"></i>
              <p>No students added yet</p>
              <small>Click "Add Students" to start building your class</small>
              <button class="btn btn-primary mt-3" @click="showAddStudentsModal = true">
                <i class="fas fa-user-plus"></i>
                Add Your First Students
              </button>
            </div>
            
            <!-- Student List -->
            <div v-else class="student-list">
              <div class="student-item" v-for="student in studentList" :key="student.id">
                <div class="student-avatar">
                  <span>{{ student.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="student-info">
                  <h5>{{ student.name }}</h5>
                  <p>{{ student.email }}</p>
                  <div class="student-stats" v-if="student.stats">
                    <span class="stat-item">
                      <i class="fas fa-keyboard"></i>
                      {{ student.stats.totalTests || 0 }} tests
                    </span>
                    <span class="stat-item" v-if="student.stats.averageWPM">
                      <i class="fas fa-tachometer-alt"></i>
                      {{ student.stats.averageWPM }} WPM avg
                    </span>
                    <span class="stat-item" v-if="student.stats.lastActive">
                      <i class="fas fa-clock"></i>
                      {{ formatLastActive(student.stats.lastActive) }}
                    </span>
                  </div>
                </div>
                <div class="student-actions">
                  <button class="btn-icon" @click="removeStudent(student.id)" title="Remove student">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Top 5 Highest WPM This Month -->
          <div class="card top-wpm-card">
            <div class="card-header">
              <h3>Top 5 Highest WPM - {{ currentMonth }}</h3>
              <button class="btn-link" @click="refreshTopWPM">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingTopWPM }"></i>
              </button>
            </div>
            <div class="top-wpm-list" v-if="!loadingTopWPM && topWPMData.length > 0">
              <div class="wpm-item" v-for="(item, index) in topWPMData" :key="item.userId">
                <div class="rank-badge" :class="getRankClass(index)">
                  {{ index + 1 }}
                </div>
                <div class="student-info">
                  <h5>{{ item.userName }}</h5>
                  <p>{{ item.topic }}</p>
                  <span class="session-time">{{ formatDate(item.timestamp) }}</span>
                </div>
                <div class="wpm-stats">
                  <div class="wpm-value">{{ item.wpm }} WPM</div>
                  <div class="accuracy-value">{{ item.accuracy }}% accuracy</div>
                  <div class="errors-value">{{ item.errorsCount || 0 }} errors</div>
                </div>
              </div>
            </div>
            <div class="loading-state" v-else-if="loadingTopWPM">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading top performers...</p>
            </div>
            <div class="empty-state" v-else>
              <i class="fas fa-chart-line"></i>
              <p>No typing results found for this month</p>
            </div>
          </div>

          <!-- Recent Activities -->
          <div class="card activities-card">
            <div class="card-header">
              <h3>Recent Activities</h3>
              <button class="btn-link" @click="refreshActivities" :disabled="loadingActivities">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingActivities }"></i>
              </button>
            </div>
            
            <!-- Loading State -->
            <div v-if="loadingActivities" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading recent activities...</p>
            </div>
            
            <!-- Empty State -->
            <div v-else-if="recentActivities.length === 0" class="empty-state">
              <i class="fas fa-clipboard-list"></i>
              <p>No recent activities found</p>
              <small>Activities will appear here when you create typing rooms</small>
            </div>
            
            <!-- Activities List -->
            <div v-else class="activities-list">
              <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
                <div class="activity-icon">
                  <i class="fas fa-keyboard"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ activity.name }}</h5>
                  <p>{{ activity.section }} • {{ activity.mode }} • {{ activity.difficulty }}</p>
                  <div class="activity-stats">
                    <span class="activity-time">{{ formatActivityDate(activity.createdAt) }}</span>
                    <span class="student-count"><i class="fas fa-users"></i> {{ activity.studentCount }} students</span>
                    <span class="room-code">Room: {{ activity.roomCode }}</span>
                  </div>
                </div>
                <div class="activity-status">
                  <span class="status-badge" :class="activity.status">{{ formatStatus(activity.status) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Room Type Selection Modal -->
    <RoomTypeSelectionModal 
      :show="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @room-type-selected="handleRoomTypeSelected"
    />

    <!-- Typing Test Room Modal -->
    <CreateRoomModal 
      :show="showTypingTestModal" 
      @close="showTypingTestModal = false"
      @room-created="handleRoomCreated"
    />

    <!-- AI Patient Room Modal -->
    <CreateAIPatientRoomModal 
      :show="showAIPatientModal" 
      @close="showAIPatientModal = false"
      @room-created="handleRoomCreated"
    />

    <!-- Add Students Modal -->
    <AddStudentsModal 
      :show="showAddStudentsModal" 
      @close="showAddStudentsModal = false"
      @students-selected="handleStudentsSelected"
      @error="handleModalError"
    />
  </div>
</template>

<script>
import CreateRoomModal from './CreateRoomModal.vue'
import RoomTypeSelectionModal from './RoomTypeSelectionModal.vue'
import CreateAIPatientRoomModal from './CreateAIPatientRoomModal.vue'
import AddStudentsModal from './AddStudentsModal.vue'
import sessionService from '../../services/sessionService'
import teacherDataService from '../../services/teacherDataService'
import { auth } from '../../firebase/init'
import api from '../../services/api'

export default {
  name: 'TeacherDashboard',
  components: {
    CreateRoomModal,
    RoomTypeSelectionModal,
    CreateAIPatientRoomModal,
    AddStudentsModal
  },
  data() {
    return {
      teacherName: 'Dr. Smith',
      teacherEmail: '',
      currentUser: null,
      currentSession: null,
      isLoggingOut: false,
      showCreateRoomModal: false,
      showTypingTestModal: false,
      showAIPatientModal: false,
      showAddStudentsModal: false,
      stats: {
        totalStudents: 156,
        activeRooms: 8,
        completedSessions: 342,
        averageScore: 87.5
      },
      activeRooms: 3,
      totalStudents: 45,
      completedActivities: 12,
      averageWPM: 68,
      // Top WPM data
      topWPMData: [],
      loadingTopWPM: false,
      currentMonth: '',
      // Recent Activities data
      loadingActivities: false,
      recentActivities: [],
      // Student List data
      studentList: [],
      loadingStudentList: false
    }
  },
  mounted() {
    // Subscribe to teacher data changes
    this.unsubscribe = teacherDataService.subscribe((teacherData, isLoading, isInitialized) => {
      if (isInitialized && teacherData) {
        this.teacherName = teacherData.name;
        this.teacherEmail = teacherData.email;
        this.currentSession = teacherData.session;
        this.currentUser = auth.currentUser;
      } else if (isInitialized && !teacherData) {
        this.teacherName = 'Teacher';
        this.teacherEmail = auth.currentUser?.email || '';
      }
    });

    // Get initial data if already loaded
    const teacherData = teacherDataService.getTeacherDataSync();
    if (teacherDataService.isDataLoaded() && teacherData) {
      this.teacherName = teacherData.name;
      this.teacherEmail = teacherData.email;
      this.currentSession = teacherData.session;
      this.currentUser = auth.currentUser;
    } else if (!teacherDataService.isDataLoading()) {
      // If not loading and no data, trigger load
      teacherDataService.getTeacherData().then(() => {
        // Data will be updated via subscription
      });
    }

    // Initialize Top WPM data
    this.initializeTopWPM();
    
    // Initialize Recent Activities data
    this.fetchRecentActivities();
    
    // Initialize Student List data
    this.fetchStudentList();
  },
  beforeUnmount() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
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
    handleRoomTypeSelected(roomType) {
      // Close the room type selection modal
      this.showCreateRoomModal = false
      
      // Open the appropriate modal based on selection
      if (roomType === 'typing-test') {
        this.showTypingTestModal = true
      } else if (roomType === 'ai-patient') {
        this.showAIPatientModal = true
      }
    },
    
    handleRoomCreated() {
      // Close all modals
      this.showCreateRoomModal = false
      this.showTypingTestModal = false
      this.showAIPatientModal = false
      
      // Refresh recent activities to show the new room
      this.fetchRecentActivities()
    },

    // Top WPM Methods
    initializeTopWPM() {
      const now = new Date();
      this.currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      this.fetchTopWPM();
    },

    async fetchTopWPM() {
      this.loadingTopWPM = true;
      try {
        const response = await api.get('/typing-results/top-wpm-monthly');
        const result = response.data;
        
        if (result.success) {
          this.topWPMData = result.data;
        } else {
          console.error('Failed to fetch top WPM data:', result.message);
          this.topWPMData = [];
        }
      } catch (error) {
        console.error('Error fetching top WPM data:', error);
        this.topWPMData = [];
      } finally {
        this.loadingTopWPM = false;
      }
    },

    refreshTopWPM() {
      this.fetchTopWPM();
    },

    getRankClass(index) {
      switch (index) {
        case 0: return 'rank-gold';
        case 1: return 'rank-silver';
        case 2: return 'rank-bronze';
        default: return 'rank-default';
      }
    },

    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Recent Activities Methods
    async fetchRecentActivities() {
      this.loadingActivities = true;
      try {
        const response = await api.get('/typing-results/recent-activities');
        const result = response.data;
        
        if (result.success) {
          this.recentActivities = result.data;
        } else {
          console.error('Failed to fetch recent activities:', result.message);
          this.recentActivities = [];
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        this.recentActivities = [];
      } finally {
        this.loadingActivities = false;
      }
    },

    refreshActivities() {
      this.fetchRecentActivities();
    },

    formatActivityDate(timestamp) {
      if (!timestamp) return 'Unknown time';
      
      // Handle Firestore timestamp format
      let date;
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
    },

    formatStatus(status) {
      switch (status) {
        case 'active': return 'Active';
        case 'waiting': return 'Waiting';
        case 'completed': return 'Completed';
        default: return status;
      }
    },

    // Student Management Methods
    async fetchStudentList() {
      this.loadingStudentList = true;
      try {
        const result = await api.teacherAPI.getStudents();
        
        if (result.success) {
          this.studentList = result.data || [];
        } else {
          console.error('Failed to fetch student list:', result.message);
          this.studentList = [];
        }
      } catch (error) {
        console.error('Error fetching student list:', error);
        this.studentList = [];
      } finally {
        this.loadingStudentList = false;
      }
    },

    refreshStudentList() {
      this.fetchStudentList();
    },

    async handleStudentsSelected(selectedStudents) {
      try {
        const result = await api.teacherAPI.addStudents(selectedStudents);
        
        if (result.success) {
          // Refresh the student list to show newly added students
          await this.fetchStudentList();
          
          // Show success message
          this.$emit('success', `Successfully added ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} to your class!`);
        } else {
          throw new Error(result.message || 'Failed to add students');
        }
      } catch (error) {
        console.error('Error adding students:', error);
        this.handleModalError('Failed to add students. Please try again.');
      }
    },

    async removeStudent(studentId) {
      if (!confirm('Are you sure you want to remove this student from your class?')) {
        return;
      }

      try {
        const result = await api.teacherAPI.removeStudent(studentId);
        
        if (result.success) {
          // Remove student from local list
          this.studentList = this.studentList.filter(s => s.id !== studentId);
          this.$emit('success', 'Student removed successfully!');
        } else {
          throw new Error(result.message || 'Failed to remove student');
        }
      } catch (error) {
        console.error('Error removing student:', error);
        this.handleModalError('Failed to remove student. Please try again.');
      }
    },

    handleModalError(message) {
      // You can implement a toast notification system here
      alert(message); // Simple alert for now
    },

    formatLastActive(timestamp) {
      if (!timestamp) return 'Never';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.teacher-dashboard {
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
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
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

.create-room-btn {
  background: var(--accent-gradient);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-room-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px var(--accent-color-alpha);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  text-align: right;
}

.user-name {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.user-email {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Dashboard Content */
.dashboard-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stat-card.primary {
  background: var(--accent-gradient);
  border: none;
}

.stat-card.secondary {
  background: var(--bg-tertiary);
}

.stat-card.tertiary {
  background: var(--bg-tertiary);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.stat-header h3 {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.stat-trend.up {
  color: var(--success-color);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-subtitle {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.difficulty-badges {
  display: flex;
  gap: 0.25rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.junior {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.badge.middle {
  background: var(--warning-color-alpha);
  color: var(--warning-color);
}

.badge.senior {
  background: var(--error-color-alpha);
  color: var(--error-color);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  height: calc(100vh - 200px);
  min-height: 600px;
}

/* Flexible card sizing */
.card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  max-height: 80vh;
}

.card-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: none;
}

/* Performance Card */
.performance-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.performance-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.circle-progress {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(var(--accent-color) 0deg, var(--accent-color) calc(var(--progress) * 3.6deg), var(--border-color) calc(var(--progress) * 3.6deg));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle-progress::before {
  content: '';
  position: absolute;
  width: 60px;
  height: 60px;
  background: var(--bg-secondary);
  border-radius: 50%;
}

.percentage {
  position: relative;
  z-index: 1;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.9rem;
}

.performance-stats {
  flex: 1;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-item .label {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.stat-item .value {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.8rem;
}

/* Quick Actions */
.quick-actions {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.75rem;
}

.action-item:hover {
  background: var(--accent-color-alpha);
}

.action-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.action-content h4 {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.action-content p {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0;
}

/* Activities Card */
.activities-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.activities-card .card-header {
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.activities-card .card-header h3 {
  color: var(--text-primary);
  font-weight: 600;
}

.activities-list {
  padding: 0 1.5rem 1.5rem 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
  max-height: 500px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.activity-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--accent-color);
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
}

.activity-content {
  flex: 1;
}

.activity-content h5 {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.activity-content p {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.activity-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.activity-time,
.student-count,
.room-code {
  color: var(--text-primary);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}

.student-count i {
  color: var(--accent-color);
}

.room-code {
  background: var(--bg-tertiary);
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-weight: 600;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.activity-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.status-badge.active {
  background: var(--success-color-alpha);
  color: var(--success-color);
  border-color: var(--success-color);
}

.status-badge.completed {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* Responsive Design */
/* Large screens and zoom out */
@media (min-width: 1400px) {
  .content-grid {
    grid-template-columns: 1fr 2.5fr;
    gap: 2rem;
  }
  
  .dashboard-content {
    padding: 2.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

/* Medium-large screens */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr 1.5fr;
    gap: 1.25rem;
  }
  
  .dashboard-content {
    padding: 1.5rem;
  }
  
  .activities-card {
    grid-column: 1 / -1;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

/* Medium screens and zoom in */
@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
    min-height: auto;
  }
  
  .dashboard-content {
    padding: 1.25rem;
    gap: 1.5rem;
  }
  
  .card {
    min-height: 300px;
  }
  
  .top-wpm-card,
  .activities-card {
    max-height: 400px;
  }
}

/* Small-medium screens */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  
  .main-content {
    margin-left: 70px;
  }
  
  .sidebar-header {
    padding: 1rem 0.75rem;
  }
  
  .logo-text {
    font-size: 1rem;
  }
  
  .logo-badge {
    display: none;
  }
  
  .teacher-badge {
    display: none;
  }
  
  .nav-item span {
    display: none;
  }
  
  .nav-item {
    justify-content: center;
    padding: 1rem 0.75rem;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .dashboard-content {
    padding: 1rem;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .user-info {
    display: none;
  }
  
  .header-right {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .add-students-btn,
  .create-room-btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Small screens and high zoom */
@media (max-width: 576px) {
  .dashboard-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .card {
    border-radius: 12px;
    min-height: 250px;
  }
  
  .card-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .header-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
  
  .top-wpm-list,
  .activities-list {
    max-height: 300px;
    padding: 0 1rem 1rem 1rem;
  }
  
  .wpm-item,
  .activity-item {
    padding: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .wmp-stats,
  .activity-stats {
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .header-right {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .add-students-btn,
  .create-room-btn {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}

/* Extra small screens and very high zoom */
@media (max-width: 480px) {
  .main-content {
    margin-left: 0;
  }
  
  .sidebar {
    display: none;
  }
  
  .dashboard-content {
    padding: 0.5rem;
  }
  
  .card-header h3 {
    font-size: 1rem;
  }
  
  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .student-info h5 {
    font-size: 0.9rem;
  }
  
  .student-stats {
    flex-direction: column;
    gap: 0.25rem;
  }
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

.stat-card,
.card {
  animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(2) {
  animation-delay: 0.1s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.2s;
}

/* Top WPM Component Styles */
.top-wpm-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.top-wpm-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.wpm-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.wpm-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  flex-shrink: 0;
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
}

.rank-default {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.student-info {
  flex: 1;
}

.student-info h5 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--text-primary);
}

.student-info p {
  margin: 0 0 0.25rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.session-time {
  font-size: 0.8rem;
  color: var(--text-primary);
  opacity: 0.8;
  font-weight: 500;
}

.wpm-stats {
  text-align: right;
  flex-shrink: 0;
}

.wpm-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 0.25rem;
}

.accuracy-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  opacity: 0.9;
  font-weight: 500;
}

.errors-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  opacity: 0.9;
  font-weight: 500;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  flex: 1;
}

.loading-state i,
.empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--accent-color);
  opacity: 0.7;
}

.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.empty-state small {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-link:hover {
  background: var(--primary-color-light);
  color: var(--primary-color-dark);
}

.btn-link i {
  font-size: 0.9rem;
}

/* Activity Stats Styles */
.activity-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.activity-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.room-code {
  background: var(--background-light);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 500;
}

.student-count i {
  font-size: 0.7rem;
}

/* Status Badge Improvements */
.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2d5a2d;
}

.status-badge.waiting {
  background: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background: #d1ecf1;
  color: #0c5460;
}

/* Student Management Styles */
.add-students-btn {
  margin-right: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.add-students-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.student-list-card {
  min-height: 400px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem 1.5rem;
  max-height: calc(100vh - 300px);
}

.student-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 80px;
  flex-wrap: wrap;
  gap: 1rem;
}

.student-item:hover {
  border-color: var(--accent-color);
}

.student-info {
  flex: 1;
  min-width: 200px;
}

.student-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.student-actions {
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

/* Top WPM Card Responsive */
.top-wpm-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 400px;
  max-height: 600px;
}

.top-wpm-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
  flex: 1;
}

.wpm-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  min-height: 80px;
  flex-wrap: wrap;
}

.wpm-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: 120px;
}

/* Activities Card Responsive */
.activities-card {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 600px;
}

.activities-list {
  padding: 0 1.5rem 1.5rem 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
  max-height: 500px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  min-height: 80px;
  flex-wrap: wrap;
}

.activity-content {
  flex: 1;
  min-width: 200px;
}

.activity-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-info h5 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.student-info p {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.student-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-item i {
  font-size: 0.7rem;
  opacity: 0.8;
}

.student-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--error-color-light);
  color: var(--error-color);
}

.mt-3 {
  margin-top: 1rem;
}

/* Content Grid Adjustments */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>