<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-user-md me-2"></i>
          Create AI Patient Room
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="createRoom" class="modal-body">
        <!-- Activity Name -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-tag me-2"></i>
            Activity Name
          </label>
          <input
            type="text"
            v-model="formData.activityName"
            class="form-control"
            placeholder="Enter activity name (e.g., Patient Assessment Practice)"
            required
          />
        </div>

        <!-- Section -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-users me-2"></i>
            Section
          </label>
          <select
            v-model="formData.section"
            class="form-control"
            required
          >
            <option value="">Select Section</option>
            <option v-for="section in availableSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <i class="fas fa-info-circle"></i>
          <div class="info-content">
            <h5>AI Patient Room Features</h5>
            <ul>
              <li>Interactive AI-powered patient simulation</li>
              <li>Real-time conversation and responses</li>
              <li>Nursing scenario practice environment</li>
              <li>No time limits or scoring - focus on learning</li>
            </ul>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="modal-actions">
          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errorMessage }}
          </div>
          
          <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isCreating">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isCreating">
            <i v-if="isCreating" class="fas fa-spinner fa-spin me-2"></i>
            <i v-else class="fas fa-check me-2"></i>
            {{ isCreating ? 'Creating...' : 'Create AI Patient Room' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import teacherDataService from '../../services/teacherDataService';
import { auth } from '../../firebase/init';

export default {
  name: 'CreateAIPatientRoomModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCreating: false,
      errorMessage: '',
      formData: {
        activityName: '',
        section: ''
      },
      // Available sections for 2nd year students (same as typing test)
      availableSections: ['BSN-2A', 'BSN-2B', 'BSN-2C', 'BSN-2D']
    }
  },
  computed: {
    isFormValid() {
      return !!(this.formData.activityName && this.formData.section)
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },
    async createRoom() {
      if (!this.isFormValid) return

      try {
        // Show loading state
        this.isCreating = true

        // Map form data to API format for AI Patient room
        const roomData = {
          activityName: this.formData.activityName,
          section: this.formData.section,
          yearLevel: '2nd', // Default to 3rd year
          roomType: 'AI Patient', // New field to distinguish room types
          mode: 'AI Patient', // Special mode for AI Patient rooms
          duration: null, // No duration for AI Patient rooms
          wordCount: null, // No word count for AI Patient rooms
          module: 'AI Patient Simulation', // Default module for AI Patient
          difficultyLevel: 'Interactive', // Special difficulty for AI Patient
          teacherId: this.getCurrentTeacherId(),
          teacherName: this.getCurrentTeacherName()
        }

        // Call backend API to create room
        const response = await this.$roomAPI.createRoom(roomData)

        if (response.success) {
          // Show success message
          this.$emit('room-created', response.data)
          
          // Close modal
          this.closeModal()
          
          // Redirect to room interface with room code
          this.$router.push({
            name: 'RoomInterface',
            params: { roomCode: response.data.roomCode }
          })
        }

      } catch (error) {
        console.error('Error creating AI Patient room:', error)
        
        // Handle specific error types for better user experience
        if (error.response?.status === 503) {
          // Service unavailable (quota exceeded or database issues)
          const errorData = error.response.data
          if (errorData.retryAfter) {
            this.showError(`Service temporarily unavailable. Please try again in ${Math.ceil(errorData.retryAfter / 60)} minutes.`)
          } else {
            this.showError(errorData.message || 'Service temporarily unavailable. Please try again later.')
          }
        } else if (error.response?.status === 400) {
          // Validation errors
          const errorData = error.response.data
          if (errorData.details && Array.isArray(errorData.details)) {
            this.showError(`Validation error: ${errorData.details.join(', ')}`)
          } else {
            this.showError(errorData.message || 'Invalid form data. Please check your inputs.')
          }
        } else if (error.response?.status >= 500) {
          // Server errors
          this.showError('Server error occurred. Please try again in a few minutes.')
        } else {
          // Network or other errors
          this.showError(error.message || 'Failed to create room. Please check your connection and try again.')
        }
      } finally {
        this.isCreating = false
      }
    },
    resetForm() {
      this.formData = {
        activityName: '',
        section: ''
      }
      this.errorMessage = ''
      this.isCreating = false
    },
    
    // Helper methods for API data mapping
    getCurrentTeacherId() {
      // Get the actual teacher ID from teacherDataService
      const teacherData = teacherDataService.getTeacherDataSync()
      if (teacherData && teacherData.id) {
        return teacherData.id
      }
      
      // Fallback: try to get from auth
      const user = auth.currentUser
      if (user) {
        return user.uid
      }
      
      console.error('❌ No teacher ID found in getCurrentTeacherId')
      return null
    },
    
    getCurrentTeacherName() {
      // Get the actual teacher name from teacherDataService
      const teacherData = teacherDataService.getTeacherDataSync()
      if (teacherData && teacherData.name) {
        return teacherData.name
      }
      
      // Fallback
      return 'Teacher'
    },
    
    showError(message) {
      this.errorMessage = message
      setTimeout(() => {
        this.errorMessage = ''
      }, 5000)
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        // Add animation class when modal opens
        this.$nextTick(() => {
          document.body.style.overflow = 'hidden'
        })
      } else {
        document.body.style.overflow = ''
      }
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
  width: 100%;
  height: 100%;
  background: var(--modal-overlay);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px var(--shadow-dark);
  animation: slideUp 0.4s ease-out;
  font-family: 'DM Sans', sans-serif;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1rem 2rem 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--accent-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px var(--accent-color-alpha);
}

.info-box {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  display: flex;
  gap: 1rem;
}

.info-box i {
  font-size: 1.5rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.info-content h5 {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  font-size: 1.1rem;
}

.info-content ul {
  margin: 0;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.info-content li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.error-message {
  background: #fee;
  color: #c53030;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  margin-right: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(240, 147, 251, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

/* CSS Variables (assuming they exist in the main app) */
:root {
  --modal-overlay: rgba(0, 0, 0, 0.5);
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  --border-primary: #e2e8f0;
  --border-color: #e2e8f0;
  --accent-color: #f5576c;
  --accent-color-alpha: rgba(245, 87, 108, 0.1);
  --shadow-dark: rgba(0, 0, 0, 0.15);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a202c;
    --bg-secondary: #2d3748;
    --text-primary: #f7fafc;
    --text-secondary: #a0aec0;
    --border-primary: #4a5568;
    --border-color: #4a5568;
  }
}
</style>