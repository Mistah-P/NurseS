<template>
  <div class="student-dashboard">
    <!-- Main Content -->
    <main class="main-content">

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Top Row - User Profile Card -->
        <div class="profile-section" style="display: none;">
          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="profile-info">
                <h2 class="profile-name">{{ username }}</h2>
                <p class="profile-email">{{ email }}</p>
                <div class="profile-meta">
                  <span class="meta-item"><strong>Joined:</strong> April 15 2025</span>
                  <span class="meta-item"><strong>Streak:</strong> 9 days</span>
                </div>
              </div>
              <div class="progress-section">
                <div class="progress-circle-large">
                  <span class="progress-number">5</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card secondary">
            <div class="stat-header">
              <h3>Today's Latest Test</h3>
            </div>
            <div class="stats-content" v-if="!isLoadingTodayStats">
              <div class="stat-item">
                <div class="stat-value">{{ todayStats.avgWpm }}</div>
                <div class="stat-label">WPM</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayStats.avgAccuracy }}%</div>
                <div class="stat-label">Accuracy</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayStats.errorsCount }}</div>
                <div class="stat-label">Errors</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayStats.topModule }}</div>
                <div class="stat-label">Module</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayStats.topDifficulty }}</div>
                <div class="stat-label">Difficulty</div>
              </div>
            </div>
            <div class="loading-content" v-else>
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <p class="loading-text">Loading today's stats...</p>
            </div>
          </div>

          <!-- Enhanced Teacher Code Input Card -->
          <div class="stat-card teacher-code-card enhanced-join-card">
            <div class="join-card-glow"></div>
            <div class="stat-header enhanced-header">
              <div class="header-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="header-content">
                <h3>Join Teacher's Room</h3>
                <p class="header-subtitle">Connect with your class instantly</p>
              </div>
            </div>
            <div class="teacher-code-content enhanced-content">
              <p class="code-description">Enter the 6-digit code provided by your teacher:</p>
              <div class="code-input-group enhanced-input-group">
                <div class="input-wrapper">
                  <i class="fas fa-key input-icon"></i>
                  <input 
                    type="text" 
                    v-model="teacherCode" 
                    placeholder="Enter code..."
                    class="code-input enhanced-input"
                    @keyup.enter="joinTeacherRoom"
                    maxlength="8"
                  />
                </div>
                <button 
                  @click="joinTeacherRoom" 
                  class="join-btn enhanced-join-btn"
                  :disabled="!teacherCode.trim() || isJoiningRoom"
                >
                  <span v-if="!isJoiningRoom">
                    <i class="fas fa-sign-in-alt"></i>
                    Join Room
                  </span>
                  <span v-else>
                    <i class="fas fa-spinner fa-spin"></i>
                    Joining...
                  </span>
                </button>
              </div>
              <div v-if="codeMessage" :class="['code-message', codeMessageType]">
                <i :class="codeMessageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                {{ codeMessage }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Test History Table -->
        <div class="card table-card">
          <div class="card-header">
            <h3>Recent Test History</h3>
          </div>
          <div class="table-content" v-if="!isLoadingTestHistory">
            <table>
              <thead>
                <tr>
                  <th>WPM</th>
                  <th>Accuracy</th>
                  <th>Errors</th>
                  <th>Module</th>
                  <th>Difficulty</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(test, index) in testHistory" :key="index">
                  <td>{{ test.wpm }}</td>
                  <td>{{ test.accuracy }}</td>
                  <td>{{ test.errors }}</td>
                  <td>{{ test.module }}</td>
                  <td>{{ test.difficulty }}</td>
                  <td>{{ test.date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="loading-content" v-else>
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-text">Loading test history...</p>
          </div>
        </div>


      </div>
    </main>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";
import { auth } from '../firebase/init';
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import sessionService from '../services/sessionService';
import typingResultsService from '../services/typingResultsService';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

export default {
  name: "UserPage",
  data() {
    return {
      username: '',
      email: '',
      progress: 0,
      teacherCode: '',
      codeMessage: '',
      codeMessageType: 'success', // 'success' or 'error'
      isJoiningRoom: false, // Add loading state for room joining
      isLoadingTodayStats: true, // Loading state for today's stats
      isLoadingTestHistory: true, // Loading state for test history
      authUnsubscribe: null, // Store the auth listener unsubscribe function
      testHistory: [],
      // Today's Statistics - calculated from real data
      todayStats: {
        avgWpm: 0,
        avgAccuracy: 0,
        topModule: 'N/A',
        topDifficulty: 'N/A'
      }
    }
  },
  methods: {
    async fetchUserDetails(user) {
      if (!user) {
        this.username = "Unknown User";
        this.email = "";
        return;
      }

      const db = getFirestore();
      const userDoc = doc(db, "users", user.uid);

      try {
        console.log("Fetching user details for UID:", user.uid);
        const docSnap = await getDoc(userDoc);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log("User data found:", userData);
          
          // Ensure we have a valid name
          const userName = userData.name?.trim();
          if (userName && userName.length > 0) {
            this.username = userName;
          } else {
            console.warn("User document exists but name is empty or invalid:", userData.name);
            this.username = "Unknown User";
          }
          
          this.email = userData.email || user.email;
        } else {
          console.warn("No user document found for UID:", user.uid);
          
          // Try to create a user document with the current user's email
          // This handles cases where the user was created but the document wasn't saved
          if (user.email) {
            try {
              const newUserData = {
                name: user.displayName || "User", // Use displayName if available
                email: user.email,
                createdAt: new Date()
              };
              
              await setDoc(userDoc, newUserData);
              console.log("Created missing user document:", newUserData);
              
              this.username = newUserData.name;
              this.email = newUserData.email;
            } catch (createError) {
              console.error("Error creating user document:", createError);
              this.username = "Unknown User";
              this.email = user.email;
            }
          } else {
            this.username = "Unknown User";
            this.email = user.email || "";
          }
        }

        // Fetch test history after user details are loaded
        await this.fetchTestHistory(user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        this.username = "Unknown User";
        this.email = user.email || "";
        
        // Retry once after a short delay
        setTimeout(() => {
          this.retryFetchUserDetails(user);
        }, 1000);
      }
    },

    async retryFetchUserDetails(user) {
      if (!user) return;
      
      const db = getFirestore();
      const userDoc = doc(db, "users", user.uid);

      try {
        console.log("Retrying user details fetch for UID:", user.uid);
        const docSnap = await getDoc(userDoc);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userName = userData.name?.trim();
          
          if (userName && userName.length > 0) {
            this.username = userName;
            this.email = userData.email || user.email;
            console.log("Retry successful, user data loaded:", userData);
          }
        }
      } catch (retryError) {
        console.error("Retry failed:", retryError);
      }
    },

    async fetchTestHistory(user) {
      try {
        // Fetch the user's recent typing test results using both user ID and email
        const results = await typingResultsService.getUserTypingResultsComplete(user.uid, user.email, { limit: 5 });
        
        if (results && results.success && results.data && results.data.length > 0) {
          // Transform the data to match our table format
          this.testHistory = results.data.map(result => ({
            wpm: Math.round(result.wpm || 0),
            accuracy: `${Math.round(result.accuracy || 0)}%`,
            errors: result.errorsCount || 0,
            module: result.content?.topic || 'General',
            difficulty: result.content?.difficulty || 'Medium',
            date: result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 
                  result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A'
          }));
          console.log("✅ Test history loaded successfully:", this.testHistory.length, "results");
        } else {
          // No data found - testHistory remains empty array
          console.log("No test history found");
        }

        // Set loading state to false after data is loaded
        this.isLoadingTestHistory = false;

        // Fetch today's statistics separately
        await this.fetchTodayStats(user);
      } catch (error) {
        console.error("Error fetching test history:", error);
        // On error, testHistory remains empty array
        this.isLoadingTestHistory = false;
        this.resetTodayStats();
      }
    },

    async fetchTodayStats(user) {
      try {
        console.log("Fetching today's statistics for user:", user.uid);
        
        // Fetch only today's typing results
        const todayResults = await typingResultsService.getTodayTypingResults(user.uid, user.email);
        
        if (todayResults && todayResults.success && todayResults.data && todayResults.data.length > 0) {
          console.log("✅ Today's statistics loaded successfully:", todayResults.data.length, "results");
          this.calculateTodayStats(todayResults.data);
        } else {
          console.log("No today's results found");
          this.resetTodayStats();
        }
        
        // Set loading state to false after data is loaded
        this.isLoadingTodayStats = false;
      } catch (error) {
        console.error("Error fetching today's statistics:", error);
        this.isLoadingTodayStats = false;
        this.resetTodayStats();
      }
    },

    calculateTodayStats(todayData) {
      // Since we're getting only today's data from the backend, no need to filter by date
      if (!todayData || todayData.length === 0) {
        this.resetTodayStats();
        return;
      }

      // Sort by timestamp to get the latest test (most recent first)
      const sortedData = [...todayData].sort((a, b) => {
        const timeA = new Date(a.timestamp?.seconds * 1000 || a.createdAt || a.timestamp);
        const timeB = new Date(b.timestamp?.seconds * 1000 || b.createdAt || b.timestamp);
        return timeB - timeA; // Most recent first
      });

      // Get the latest test results
      const latestTest = sortedData[0];

      this.todayStats = {
        avgWpm: latestTest.wpm || 0,
        avgAccuracy: latestTest.accuracy || 0,
        errorsCount: latestTest.errorsCount || 0,
        topModule: latestTest.content?.topic || 'General',
        topDifficulty: latestTest.content?.difficulty || 'Medium'
      };

      console.log("📊 Today's latest test statistics:", this.todayStats);
      console.log("📋 Latest test data:", latestTest);
    },

    getMostCommon(array) {
      const counts = {};
      array.forEach(item => counts[item] = (counts[item] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'N/A');
    },

    resetTodayStats() {
      this.todayStats = {
        avgWpm: 0,
        avgAccuracy: 0,
        errorsCount: 0,
        topModule: 'N/A',
        topDifficulty: 'N/A'
      };
    },
    async joinTeacherRoom() {
      if (!this.teacherCode.trim()) {
        this.showCodeMessage('Please enter a teacher code', 'error');
        return;
      }

      // Set loading state
      this.isJoiningRoom = true;

      try {
        // Validate teacher code format (6 character alphanumeric)
        const codePattern = /^[A-Za-z0-9]{6}$/;
        if (!codePattern.test(this.teacherCode.trim())) {
          this.showCodeMessage('Invalid code format. Room codes are 6 characters long.', 'error');
          return;
        }

        const roomCode = this.teacherCode.trim().toUpperCase();
        
        // Generate a consistent student ID based on username and room code to prevent duplicates
        // This ensures the same user gets the same ID when rejoining the same room
        const baseId = `${this.username || 'Student'}_${roomCode}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const studentId = 'student_' + btoa(baseId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        
        // Join the room using the backend API
        const response = await this.$studentAPI.joinRoom({
          roomCode: roomCode,
          studentId: studentId,
          studentName: this.username || 'Student',
          email: this.email || null,
          yearLevel: null,
          section: null
        });

        if (response.success) {
          this.showCodeMessage('Successfully joined the room!', 'success');
          
          // Store student info in Firestore for the room session
          await sessionService.createStudentSession({
            studentId: studentId,
            studentName: this.username || 'Student',
            roomCode: roomCode
          });
          
          // Navigate to the student room interface immediately
          this.$router.push(`/student-room/${roomCode}`);
        }
      } catch (error) {
        console.error('Error joining teacher room:', error);
        
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.error === 'Room not found') {
            this.showCodeMessage('Room not found. Please check the code with your teacher.', 'error');
          } else if (errorData.error === 'Room closed') {
            this.showCodeMessage('This room is no longer accepting students.', 'error');
          } else if (errorData.error === 'Already joined') {
            this.showCodeMessage('You have already joined this room.', 'error');
          } else {
            this.showCodeMessage(errorData.message || 'Failed to join room. Please try again.', 'error');
          }
        } else {
          this.showCodeMessage('Failed to join room. Please check your connection and try again.', 'error');
        }
      } finally {
        // Clear loading state
        this.isJoiningRoom = false;
      }
    },
    showCodeMessage(message, type) {
      this.codeMessage = message;
      this.codeMessageType = type;
      
      // Clear message after 5 seconds
      setTimeout(() => {
        this.codeMessage = '';
      }, 5000);
    },
    goToHome() {
      this.$router.push("/user");
    },
    goToSettings() {
      this.$router.push("/settings");
    },
    goToHighscore() {
      this.$router.push("/highscore");
    },
    goToAbout() {
        this.$router.push("/about");
      },
      logout() {
        // Add logout functionality here
        console.log("Logout clicked");
        this.$router.push("/");
      }
    },
  mounted() {
    // Set up authentication state listener
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchUserDetails(user);
      } else {
        // User not authenticated, redirect to login
        this.$router.push('/login');
      }
    });
  },
  beforeUnmount() {
    // Clean up the auth listener when component is destroyed
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  },
};
</script>

<style scoped>
/* Import Font Awesome for icons */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Dashboard Layout */
.student-dashboard {
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

/* Top Header */
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
  background: var(--bg-button);
  color: var(--text-on-accent);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-title {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title i {
  color: var(--accent-success);
  font-size: 1.8rem;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
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
  background: var(--bg-button);
  color: var(--text-inverse);
}

.nav-item i {
  width: 16px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--bg-button);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid var(--accent-error);
  color: var(--accent-error);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: rgba(245, 101, 101, 0.2);
  border-color: var(--accent-error);
}

/* Dashboard Content */
.dashboard-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Profile Section */
.profile-section {
  margin-bottom: 1rem;
}

.profile-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.profile-header {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background: var(--bg-button);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: 2rem;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.profile-email {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.profile-meta {
  display: flex;
  gap: 2rem;
}

.meta-item {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-circle-large {
  width: 50px;
  height: 50px;
  background: var(--bg-button);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-weight: bold;
  font-size: 1.2rem;
}

.progress-bar-container {
  width: 200px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--bg-button);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Teacher Code Card */
.teacher-code-card {
  background: var(--accent-gradient);
  border: 1px solid var(--accent-color-alpha-strong);
}

/* Enhanced Join Teacher's Room Card */
.enhanced-join-card {
  position: relative;
  background: var(--accent-gradient);
  border: 2px solid var(--accent-color-alpha-strong);
  box-shadow: 0 10px 30px var(--shadow-accent);
  transform: translateY(0);
  transition: all 0.3s ease;
  overflow: hidden;
}

.enhanced-join-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px var(--shadow-accent-strong);
  border-color: var(--accent-color);
}

.join-card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--accent-color-alpha) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.enhanced-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.header-icon {
  width: 50px;
  height: 50px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-inverse);
  backdrop-filter: blur(10px);
}

.header-content h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 400;
}

.enhanced-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.enhanced-input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: stretch;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  right: 1rem;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1;
}

.enhanced-input {
  width: 100%;
  padding: 1rem 1rem 1rem 2.5rem;
  background: var(--bg-input);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.enhanced-input::placeholder {
  color: var(--text-tertiary);
}

.enhanced-input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-lg);
}

.enhanced-join-btn {
  padding: 1rem 2rem;
  background: var(--bg-button);
  border: 2px solid var(--accent-success);
  border-radius: 12px;
  color: var(--text-inverse);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  box-shadow: var(--shadow-md);
}

.enhanced-join-btn:hover:not(:disabled) {
  background: var(--bg-button-hover);
  border-color: var(--accent-success);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.enhanced-join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.enhanced-message {
  padding: 1rem;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
}

.enhanced-message.success {
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid var(--accent-success);
  color: var(--accent-success);
}

.enhanced-message.error {
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid var(--accent-error);
  color: var(--accent-error);
}

.teacher-code-content {
  padding: 1.5rem;
}

.code-description {
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.code-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.code-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.code-input::placeholder {
  color: var(--text-tertiary);
}

.code-input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-tertiary);
}

.join-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.join-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--border-focus);
  transform: translateY(-1px);
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.code-message.success {
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid var(--accent-success);
  color: var(--accent-success);
}

.code-message.error {
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid var(--accent-error);
  color: var(--accent-error);
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
  background: var(--bg-secondary);
  border: none;
}

.stat-card.secondary {
  background: var(--bg-secondary);
}

.stat-header {
  margin-bottom: 1.5rem;
}

.stat-header h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding: 1rem;
}

/* Adjust grid for 5 items in Today's Latest Test */
.stat-card.secondary .stats-content {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .stat-card.secondary .stats-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-item:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-success);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent-success);
  margin-bottom: 0.5rem;
  text-shadow: var(--shadow-sm);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
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

/* Achievements */
.achievements-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.achievement-badge {
  background: rgba(72, 187, 120, 0.1);
  color: var(--accent-success);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--accent-success);
}

/* Chart */
.chart-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  height: 250px;
}

/* Table */
.table-card {
  grid-column: 1 / -1;
}

.table-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  overflow-x: auto;
}

.table-content table {
  width: 100%;
  border-collapse: collapse;
}

.table-content th,
.table-content td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table-content th {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.table-content td {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.table-content tr:hover {
  background: var(--bg-tertiary);
}

/* Loading Indicators */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .progress-section {
    justify-content: center;
  }
  
  .stats-content {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
