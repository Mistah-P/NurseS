<template>
  <div class="settings">
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
          <h1 class="page-title">Settings</h1>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Settings Sections -->
        <div class="settings-container">
          <!-- Profile Settings -->
          <div class="settings-section">
            <h3 class="section-title">Profile Settings</h3>
            
            <!-- Loading State -->
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading teacher profile...</p>
            </div>
            
            <!-- Error State -->
            <div v-else-if="error" class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>{{ error }}</p>
              <button @click="loadTeacherProfile" class="btn btn-secondary">
                <i class="fas fa-redo"></i>
                Retry
              </button>
            </div>
            
            <!-- Profile Form -->
            <div v-else>
              <div class="setting-item">
                <label for="teacherName">Teacher Name</label>
                <input type="text" id="teacherName" v-model="teacherName" class="setting-input" :disabled="saving">
              </div>
              <div class="setting-item">
                <label for="email">Email Address</label>
                <input type="email" id="email" v-model="email" class="setting-input" disabled>
                <small class="field-note">Email cannot be changed. Contact admin if needed.</small>
              </div>
            </div>
          </div>

          <!-- Change Password Section -->
          <div class="settings-section">
            <h3 class="section-title">Change Password</h3>
            <div class="setting-item">
              <label for="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" v-model="currentPassword" class="setting-input" :disabled="saving">
            </div>
            <div class="setting-item">
              <label for="newPassword">New Password</label>
              <input type="password" id="newPassword" v-model="newPassword" class="setting-input" :disabled="saving">
            </div>
            <div class="setting-item">
              <label for="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" v-model="confirmPassword" class="setting-input" :disabled="saving">
            </div>
            <div class="password-requirements">
              <small class="field-note">
                Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
              </small>
            </div>
            <div class="settings-actions">
              <button @click="changePassword" class="btn btn-primary" :disabled="saving || loading">
                <span v-if="saving" class="spinner-small"></span>
                <i v-else class="fas fa-key"></i>
                {{ saving ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </div>

          <!-- System Settings -->
          <div class="settings-section">
            <h3 class="section-title">System Preferences</h3>
            <div class="setting-item">
              <label for="theme">Theme</label>
              <select id="theme" v-model="selectedTheme" class="setting-select">
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>

          </div>

          <!-- Save Button -->
          <div class="settings-actions">
            <button @click="saveSettings" class="btn btn-primary" :disabled="saving || loading">
              <span v-if="saving" class="spinner-small"></span>
              <i v-else class="fas fa-save"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Password Change Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <i :class="passwordModalType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
            {{ passwordModalType === 'success' ? 'Success' : 'Error' }}
          </h3>
          <button class="modal-close" @click="closePasswordModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ passwordModalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closePasswordModal" class="btn btn-primary">
            <i class="fas fa-check"></i>
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { auth } from '../../firebase/init';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import teacherDataService from '../../services/teacherDataService';
import sessionService from '../../services/sessionService';
import themeService from '../../services/themeService';

export default {
  name: 'TeacherSettings',
  data() {
    return {
      activeTab: 'profile',
      // Authentication data
      currentUser: null,
      currentSession: null,
      isLoggingOut: false,
      
      // Teacher profile data
      teacherId: null,
      teacherName: '',
      email: '',
      
      // Password change data
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      
      // System preferences
      selectedTheme: 'dark',
      
      // System preferences
      theme: 'light',
      
      // UI state
      loading: true,
      saving: false,
      error: null,
      isLoadingPreferences: false,
      
      // Modal state
      showPasswordModal: false,
      passwordModalMessage: '',
      passwordModalType: 'success' // 'success' or 'error'
    }
  },
  
  async mounted() {
    // Load current theme
    this.selectedTheme = themeService.getCurrentTheme();
    
    // Subscribe to teacher data changes
    this.unsubscribe = teacherDataService.subscribe((teacherData, isLoading, isInitialized) => {
      if (isInitialized && teacherData) {
        this.teacherName = teacherData.name;
        this.email = teacherData.email;
        this.teacherId = teacherData.id;
        this.currentSession = teacherData.session;
        this.currentUser = auth.currentUser;
        this.loading = false;
      } else if (isInitialized && !teacherData) {
        this.setDefaultValues();
        this.loading = false;
      }
    });

    // Get initial data if already loaded
    const teacherData = teacherDataService.getTeacherDataSync();
    if (teacherDataService.isDataLoaded() && teacherData) {
      this.teacherName = teacherData.name;
      this.email = teacherData.email;
      this.teacherId = teacherData.id;
      this.currentSession = teacherData.session;
      this.currentUser = auth.currentUser;
      this.loading = false;
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
  
  watch: {
    selectedTheme(newTheme) {
      // Only apply theme changes when not loading preferences
      if (!this.isLoadingPreferences) {
        themeService.setTheme(newTheme);
      }
    }
  },
  
  methods: {
    async loadTeacherProfile() {
      try {
        this.loading = true;
        this.error = null;
        
        // Get teacher ID from session/auth (you may need to adjust this based on your auth system)
        const teacherId = this.getTeacherIdFromSession();
        
        if (!teacherId) {
          throw new Error('Teacher not authenticated');
        }
        
        // Fetch teacher data from the teacher profile endpoint (no admin access required)
        const response = await axios.get(`http://localhost:3000/api/admin/teachers/${teacherId}/profile`);
        
        if (response.data.success) {
          const teacherData = response.data.data;
          
          // Populate form fields with data from database
          this.teacherId = teacherData.id;
          this.teacherName = teacherData.name || '';
          this.email = teacherData.email || '';
        }
        
      } catch (error) {
        console.error('Error loading teacher profile:', error);
        this.error = 'Failed to load teacher profile. Please try again.';
        
        // Fallback to default values if API fails
        this.setDefaultValues();
      } finally {
        this.loading = false;
      }
    },
    
    getTeacherIdFromSession() {
      // Get teacher ID from current Firebase Auth user and session
      try {
        if (this.currentUser && this.currentSession) {
          return this.currentSession.teacherData.teacherId || this.currentUser.uid;
        }
        return null;
      } catch (error) {
        console.error('Error getting teacher ID from session:', error);
        return null;
      }
    },
    
    setDefaultValues() {
      // Set default values if API call fails
      this.teacherName = 'John Doe';
      this.email = 'john.doe@example.com';
    },
    
    async saveSettings() {
      try {
        this.saving = true;
        this.error = null;
        
        if (!this.teacherId) {
          throw new Error('Teacher ID not found');
        }
        
        // Prepare update data (only name since email cannot be changed)
        const updateData = {
          name: this.teacherName
        };
        
        // Update teacher profile using the new self-update endpoint
        const response = await axios.put(
          `http://localhost:3000/api/admin/teachers/${this.teacherId}/profile`, 
          updateData
        );
        
        if (response.data.success) {
          // Save theme using theme service
          await themeService.setTheme(this.selectedTheme);
          
          // Show success message
          this.showSuccessMessage('Settings saved successfully!');
        }
        
      } catch (error) {
        console.error('Error saving settings:', error);
        this.error = error.response?.data?.message || 'Failed to save settings. Please try again.';
        this.showErrorMessage(this.error);
      } finally {
        this.saving = false;
      }
    },

    async changePassword() {
      try {
        // Validate password fields
        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
          this.error = 'Please fill in all password fields.';
          return;
        }

        if (this.newPassword !== this.confirmPassword) {
          this.error = 'New password and confirmation do not match.';
          return;
        }

        if (this.newPassword.length < 6) {
          this.error = 'New password must be at least 6 characters long.';
          return;
        }

        this.saving = true;
        this.error = null;

        // Call Firebase Auth to update password
        const user = this.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Re-authenticate user with current password first
        const credential = EmailAuthProvider.credential(
          user.email,
          this.currentPassword
        );
        
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, this.newPassword);
        
        // Clear password fields
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        
        this.showSuccessMessage('Password changed successfully!');
        
      } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
          this.error = 'Current password is incorrect.';
        } else if (error.code === 'auth/weak-password') {
          this.error = 'New password is too weak.';
        } else {
          this.error = 'Failed to change password. Please try again.';
        }
        this.showErrorMessage(this.error);
      } finally {
        this.saving = false;
      }
    },
    
    async loadPreferences() {
      try {
        this.isLoadingPreferences = true;
        const teacherId = this.getTeacherIdFromSession();
        if (teacherId) {
          const preferences = await sessionService.getTeacherPreferences(teacherId);
          if (preferences) {
            // Use current theme from theme service instead of overriding
            this.selectedTheme = themeService.getCurrentTheme();
            this.selectedLanguage = preferences.selectedLanguage || 'en';
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        this.isLoadingPreferences = false;
      }
    },
    
    showSuccessMessage(message) {
      this.passwordModalMessage = message;
      this.passwordModalType = 'success';
      this.showPasswordModal = true;
    },
    
    showErrorMessage(message) {
      this.passwordModalMessage = message;
      this.passwordModalType = 'error';
      this.showPasswordModal = true;
    },
    
    closePasswordModal() {
      this.showPasswordModal = false;
      this.passwordModalMessage = '';
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
    }
  },
  
  created() {
    // Load preferences on component creation
    this.loadPreferences();
  }
}
  </script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.settings {
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

.logo {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
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
  color: var(--accent-error) !important;
}

.logout-item:hover {
  background: var(--error-color-alpha) !important;
  color: var(--accent-error) !important;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 280px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.page-title {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.dashboard-content {
  padding: 2rem;
}

/* Settings Styles */
.settings-container {
  width: 100%;
}

.settings-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.section-title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.setting-input,
.setting-select {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* Toggle Switch */
.toggle-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0 !important;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  position: relative;
  margin-right: 0.75rem;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--text-primary);
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background: var(--accent-color);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Actions */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--accent-gradient);
  /*color: var(--text-white);*/
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent);
}

/* Loading and Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--danger-color);
  text-align: center;
}

.error-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-white);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.field-note {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.setting-input:disabled {
  background-color: var(--bg-tertiary);
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-white);
}

.btn-secondary:hover {
  background: var(--bg-quaternary);
  transform: translateY(-1px);
}

/* Password Change Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-modal);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-gradient);
}

.modal-title {
  margin: 0;
  color: var(--text-white);
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title .fa-check-circle {
  color: var(--success-color);
}

.modal-title .fa-exclamation-triangle {
  color: var(--danger-color);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-white);
}

.modal-body {
  padding: 24px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.modal-body p {
  margin: 0;
  font-size: 1rem;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  background: var(--bg-tertiary);
}

.modal-footer .btn {
  min-width: 100px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-container {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }
}
</style>