<template>
  <div class="teacher-dashboard">
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
          <h1 class="page-title">Dashboard</h1>
        </div>
        <div class="header-right">
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
          <div class="stat-card primary">
            <div class="stat-header">
              <h3>Active Rooms</h3>
              <div class="stat-trend up">
                <i class="fas fa-arrow-up"></i>
                <span>{{ activeRooms }}</span>
              </div>
            </div>
            <div class="stat-number">{{ activeRooms }}</div>
            <div class="stat-subtitle">rooms running</div>
          </div>

          <div class="stat-card secondary">
            <div class="stat-header">
              <h3>Weekly Progress</h3>
              <div class="stat-trend">
                <span>{{ completedActivities }}</span>
                <small>activities</small>
              </div>
            </div>
            <div class="stat-number">{{ completedActivities }}</div>
            <div class="stat-subtitle">Completed</div>
          </div>

          <div class="stat-card tertiary">
            <div class="stat-header">
              <h3>Students</h3>
              <div class="difficulty-badges">
                <span class="badge junior">Junior</span>
                <span class="badge middle">Middle</span>
                <span class="badge senior">Senior</span>
              </div>
            </div>
            <div class="stat-number">{{ totalStudents }}</div>
            <div class="stat-subtitle">total students</div>
          </div>
        </div>

        <!-- Second Row -->
        <div class="content-grid">
          <!-- Performance Analysis -->
          <div class="card performance-card">
            <div class="card-header">
              <h3>Performance Analysis</h3>
            </div>
            <div class="performance-content">
              <div class="performance-circle">
                <div class="circle-progress" :style="{ '--progress': averageWPM + '%' }">
                  <span class="percentage">{{ averageWPM }}%</span>
                </div>
              </div>
              <div class="performance-stats">
                <div class="stat-item">
                  <span class="label">Average WPM</span>
                  <span class="value">{{ averageWPM }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Accuracy</span>
                  <span class="value">94%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card quick-actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions">
              <div class="action-item" @click="showCreateRoomModal = true">
                <div class="action-icon">
                  <i class="fas fa-plus-circle"></i>
                </div>
                <div class="action-content">
                  <h4>Create New Room</h4>
                  <p>Start a new typing session</p>
                </div>
              </div>
              <div class="action-item">
                <div class="action-icon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="action-content">
                  <h4>View Analytics</h4>
                  <p>Check student progress</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activities -->
          <div class="card activities-card">
            <div class="card-header">
              <h3>Recent Activities</h3>
              <button class="btn-link">View all</button>
            </div>
            <div class="activities-list">
              <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
                <div class="activity-icon">
                  <i class="fas fa-keyboard"></i>
                </div>
                <div class="activity-content">
                  <h5>{{ activity.name }}</h5>
                  <p>{{ activity.section }} • {{ activity.difficulty }}</p>
                  <span class="activity-time">{{ activity.createdAt }}</span>
                </div>
                <div class="activity-status">
                  <span class="status-badge" :class="activity.status">{{ activity.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Room Modal -->
    <CreateRoomModal 
      :show="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @room-created="handleRoomCreated"
    />
  </div>
</template>

<script>
import CreateRoomModal from './CreateRoomModal.vue'
import sessionService from '../../services/sessionService'
import teacherDataService from '../../services/teacherDataService'
import { auth } from '../../firebase/init'

export default {
  name: 'TeacherDashboard',
  components: {
    CreateRoomModal
  },
  data() {
    return {
      teacherName: 'Dr. Smith',
      teacherEmail: '',
      currentUser: null,
      currentSession: null,
      isLoggingOut: false,
      showCreateRoomModal: false,
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
      recentActivities: [
        {
          id: 1,
          name: 'Medical Terminology Quiz',
          section: 'BSN-2A',
          mode: 'Timed (5 mins)',
          difficulty: 'Normal',
          status: 'active',
          createdAt: '2 hours ago'
        },
        {
          id: 2,
          name: 'Nursing Procedures',
          section: 'BSN-1B',
          mode: 'No Time',
          difficulty: 'Easy',
          status: 'completed',
          createdAt: '1 day ago'
        },
        {
          id: 3,
          name: 'Patient Care Documentation',
          section: 'BSN-3A',
          mode: 'Timed (3 mins)',
          difficulty: 'Hard',
          status: 'completed',
          createdAt: '2 days ago'
        }
      ]
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
    handleRoomCreated() {
      // Handle room creation logic here
      this.showCreateRoomModal = false
      // You can add the new room to recent activities or refresh data
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
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
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
  color: var(--accent-color);
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
.activities-list {
  padding: 0 1.5rem 1.5rem 1.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: var(--bg-tertiary);
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
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.activity-content p {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0 0 0.25rem 0;
}

.activity-time {
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-badge.active {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.status-badge.completed {
  background: var(--text-secondary-alpha);
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .activities-card {
    grid-column: 1 / -1;
  }
}

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
  
  .logo {
    font-size: 1rem;
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
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    display: none;
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
</style>