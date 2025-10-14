<template>
  <div class="settings-page">
    <!-- Settings Content -->
    <div class="settings-content">
      <!-- Profile Settings Card -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-user"></i>
            Profile Information
          </h2>
          <p class="card-subtitle">Update your personal information</p>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="form-group">
              <label for="fullName" class="form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                v-model="profileData.fullName"
                class="form-input"
                placeholder="Enter your full name"
              />
            </div>
            
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                v-model="profileData.email"
                class="form-input"
                placeholder="Enter your email"
                readonly
              />
              <small class="form-help">Email cannot be changed</small>
            </div>
            
            <!-- Student Year - Hidden -->
            <div class="form-group" style="display: none;">
              <label for="studentYear" class="form-label">
                <i class="fas fa-graduation-cap me-2"></i>
                Student Year
              </label>
              <select
                id="studentYear"
                v-model="profileData.studentYear"
                class="form-input"
                @change="onYearChange"
                required
              >
                <option value="">Select Year</option>
                <option v-for="year in years" :key="year.value" :value="year.value">
                  {{ year.label }}
                </option>
              </select>
            </div>

            <!-- Section - Hidden -->
            <div class="form-group" style="display: none;" v-if="profileData.studentYear">
              <label for="section" class="form-label">
                <i class="fas fa-users me-2"></i>
                Section
              </label>
              <select
                id="section"
                v-model="profileData.section"
                class="form-input"
                required
              >
                <option value="">Select Section</option>
                <option v-for="section in availableSections" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isUpdatingProfile">
                <i class="fas fa-save"></i>
                {{ isUpdatingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Security Settings Card -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-shield-alt"></i>
            Security Settings
          </h2>
          <p class="card-subtitle">Manage your password and security preferences</p>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="changePassword" class="password-form">
            <div class="form-group">
              <label for="currentPassword" class="form-label">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                v-model="passwordData.currentPassword"
                class="form-input"
                placeholder="Enter your current password"
              />
            </div>
            
            <div class="form-group">
              <label for="newPassword" class="form-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                v-model="passwordData.newPassword"
                class="form-input"
                placeholder="Enter your new password"
              />
            </div>
            
            <div class="form-group">
              <label for="confirmPassword" class="form-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="passwordData.confirmPassword"
                class="form-input"
                placeholder="Confirm your new password"
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isChangingPassword">
                <i class="fas fa-key"></i>
                {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preferences Card -->
      <div class="settings-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-palette"></i>
            Preferences
          </h2>
          <p class="card-subtitle">Customize your experience</p>
        </div>
        
        <div class="card-body">
          <div class="preference-item">
            <div class="preference-info">
              <h3 class="preference-title">Theme</h3>
              <p class="preference-description">Choose your preferred color theme</p>
            </div>
            <div class="preference-control">
              <select v-model="preferences.theme" class="form-select" @change="updateTheme">
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      <i :class="messageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      {{ message }}
    </div>
  </div>
</template>

<script>
import { auth, db } from '../firebase/init'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import themeService from '../services/themeService'

export default {
  name: 'UserSettings',
  data() {
    return {
      profileData: {
        fullName: '',
        email: '',
        studentYear: '',
        section: ''
      },
      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      preferences: {
        theme: 'dark'
      },
      isUpdatingProfile: false,
      isChangingPassword: false,
      isLoadingUserData: false,
      message: '',
      messageType: 'success',
      currentUser: null,
      years: [
        { value: '1st', label: '1st Year' },
        { value: '2nd', label: '2nd Year' },
        { value: '3rd', label: '3rd Year' },
        { value: '4th', label: '4th Year' }
      ],
      sections: {
        '1st': ['BSN-1A', 'BSN-1B', 'BSN-1C', 'BSN-1D'],
        '2nd': ['BSN-2A', 'BSN-2B', 'BSN-2C', 'BSN-2D'],
        '3rd': ['BSN-3A', 'BSN-3B', 'BSN-3C', 'BSN-3D'],
        '4th': ['BSN-4A', 'BSN-4B', 'BSN-4C', 'BSN-4D']
      }
    }
  },
  computed: {
    availableSections() {
      return this.sections[this.profileData.studentYear] || []
    }
  },
  mounted() {
    this.setupAuthListener()
    // Load current theme
    this.preferences.theme = themeService.getCurrentTheme()
  },
  
  watch: {
    'preferences.theme'(newTheme) {
      // Only apply theme changes when user manually changes it, not during data loading
      if (!this.isLoadingUserData) {
        themeService.setTheme(newTheme);
      }
    }
  },
  methods: {
    setupAuthListener() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.currentUser = user
          this.loadUserData()
        } else {
          this.$router.push('/login')
        }
      })
    },
    
    async loadUserData() {
      try {
        this.isLoadingUserData = true
        if (this.currentUser) {
          // Load profile data
          const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            this.profileData = {
              fullName: userData.name || '',
              email: this.currentUser.email || '',
              studentYear: userData.studentYear || '',
              section: userData.section || ''
            }
            
            // Load preferences - use current theme from theme service to avoid overriding
            this.preferences = {
              theme: themeService.getCurrentTheme()
            }
          } else {
            this.profileData = {
              fullName: '',
              email: this.currentUser.email || '',
              studentYear: '',
              section: ''
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        this.showMessage('Error loading user data', 'error')
      } finally {
        this.isLoadingUserData = false
      }
    },
    
    async updateProfile() {
      if (!this.currentUser) return
      
      // Validation for required fields
      if (!this.profileData.fullName.trim()) {
        this.showMessage('Full name is required', 'error')
        return
      }
      
      if (!this.profileData.studentYear) {
        this.showMessage('Student year is required', 'error')
        return
      }
      
      if (!this.profileData.section) {
        this.showMessage('Section is required', 'error')
        return
      }
      
      this.isUpdatingProfile = true
      try {
        await updateDoc(doc(db, 'users', this.currentUser.uid), {
          name: this.profileData.fullName,
          studentYear: this.profileData.studentYear,
          section: this.profileData.section,
          updatedAt: new Date()
        })
        
        this.showMessage('Profile updated successfully!', 'success')
      } catch (error) {
        console.error('Error updating profile:', error)
        this.showMessage('Error updating profile', 'error')
      } finally {
        this.isUpdatingProfile = false
      }
    },
    
    onYearChange() {
      // Reset section when year changes
      this.profileData.section = ''
    },
    
    async changePassword() {
      if (!this.currentUser) return
      
      // Validation
      if (!this.passwordData.currentPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
        this.showMessage('Please fill in all password fields', 'error')
        return
      }
      
      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.showMessage('New passwords do not match', 'error')
        return
      }
      
      if (this.passwordData.newPassword.length < 6) {
        this.showMessage('New password must be at least 6 characters', 'error')
        return
      }
      
      this.isChangingPassword = true
      try {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          this.currentUser.email,
          this.passwordData.currentPassword
        )
        await reauthenticateWithCredential(this.currentUser, credential)
        
        // Update password
        await updatePassword(this.currentUser, this.passwordData.newPassword)
        
        // Clear form
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        
        this.showMessage('Password changed successfully!', 'success')
      } catch (error) {
        console.error('Error changing password:', error)
        if (error.code === 'auth/wrong-password') {
          this.showMessage('Current password is incorrect', 'error')
        } else {
          this.showMessage('Error changing password', 'error')
        }
      } finally {
        this.isChangingPassword = false
      }
    },
    
    async updateTheme() {
      if (!this.currentUser) return
      
      try {
        // Use theme service to set theme (it will handle saving to database)
        await themeService.setTheme(this.preferences.theme)
        this.showMessage('Theme preference saved!', 'success')
      } catch (error) {
        console.error('Error updating theme:', error)
        this.showMessage('Error saving theme preference', 'error')
      }
    },
    
    showMessage(text, type = 'success') {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 5000)
    }
  }
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

.settings-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Page Header Styles - Removed */

/* Settings Content */
.settings-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Settings Cards */
.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.card-title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-title i {
  color: var(--accent-success);
}

.card-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Forms */
.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-success);
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

.form-input[readonly] {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.form-help {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 1rem;
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-success) 0%, #38a169 100%);
  color: var(--text-on-accent);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-primary);
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info {
  flex: 1;
}

.preference-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.preference-description {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0;
}

.preference-control {
  flex-shrink: 0;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-primary);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-on-accent);
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-success);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Messages */
.message {
  position: fixed;
  top: 100px;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid var(--accent-success);
  color: var(--accent-success);
}

.message.error {
  background: rgba(245, 101, 101, 0.1);
  border: 1px solid var(--accent-error);
  color: var(--accent-error);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-content {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem 1rem;
  }
  
  .card-header,
  .card-body {
    padding: 1rem;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .message {
    right: 1rem;
    left: 1rem;
  }
}
</style>