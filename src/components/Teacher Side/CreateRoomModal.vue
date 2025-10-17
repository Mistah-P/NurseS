<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-plus-circle me-2"></i>
          Create New Room
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
            placeholder="Enter activity name"
            required
          />
        </div>

        <!-- Student Year (Hidden) -->
        <div class="form-group" style="display: none;">
          <label class="form-label">
            <i class="fas fa-graduation-cap me-2"></i>
            Student Year
          </label>
          <select
            v-model="formData.studentYear"
            class="form-control"
            @change="onYearChange"
            required
          >
            <option value="">Select Year</option>
            <option v-for="year in years" :key="year.value" :value="year.value">
              {{ year.label }}
            </option>
          </select>
        </div>

        <!-- Section (always visible) -->
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

        <!-- Game Mode -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-gamepad me-2"></i>
            Game Mode
          </label>
          <div class="radio-group">
            <div class="radio-item">
              <input
                type="radio"
                id="timed"
                value="timed"
                v-model="formData.gameMode"
                class="radio-input"
              />
              <label for="timed" class="radio-label">
                <i class="fas fa-clock me-2"></i>
                Timed
              </label>
            </div>
            <div class="radio-item">
              <input
                type="radio"
                id="word-count"
                value="word-count"
                v-model="formData.gameMode"
                class="radio-input"
              />
              <label for="word-count" class="radio-label">
                <i class="fas fa-list-ol me-2"></i>
                Word Count Challenge
              </label>
            </div>
          </div>
        </div>

        <!-- Time Duration (appears when Timed is selected) -->
        <div class="form-group" v-if="formData.gameMode === 'timed'">
          <label class="form-label">
            <i class="fas fa-stopwatch me-2"></i>
            Duration
          </label>
          <select
            v-model="formData.duration"
            class="form-control"
            required
          >
            <option value="">Select Duration</option>
            <option v-for="duration in durations" :key="duration.value" :value="duration.value">
              {{ duration.label }}
            </option>
          </select>
        </div>

        <!-- Word Count (appears when Word Count Challenge is selected) -->
        <div class="form-group" v-if="formData.gameMode === 'word-count'">
          <label class="form-label">
            <i class="fas fa-list-ol me-2"></i>
            Target Word Count
          </label>
          <select
            v-model="formData.wordCount"
            class="form-control"
            required
          >
            <option value="">Select Word Count</option>
            <option value="50">50 words</option>
            <option value="100">100 words</option>
            <option value="150">150 words</option>
            <option value="200">200 words</option>
            <option value="250">250 words</option>
            <option value="300">300 words</option>
          </select>
        </div>

        <!-- Module Selection -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-book me-2"></i>
            Module
          </label>
          <select
            v-model="formData.module"
            class="form-control"
            required
          >
            <option value="">Select Module</option>
            <option v-for="module in modules" :key="module.id" :value="module.id">
              {{ module.label }}
            </option>
          </select>
        </div>

        <!-- Difficulty Level -->
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-chart-line me-2"></i>
            Difficulty Level
          </label>
          <div class="difficulty-buttons">
            <button
              type="button"
              v-for="difficulty in difficulties"
              :key="difficulty.value"
              :class="['difficulty-btn', difficulty.class, { active: formData.difficulty === difficulty.value }]"
              @click="formData.difficulty = difficulty.value"
            >
              <i :class="difficulty.icon + ' me-2'"></i>
              {{ difficulty.label }}
            </button>
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
            {{ isCreating ? 'Creating...' : 'Create Room' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import moduleService from '../../services/moduleService';
import teacherDataService from '../../services/teacherDataService';
import { auth } from '../../firebase/init';

export default {
  name: 'CreateRoomModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  async mounted() {
    try {
      // Force re-upload modules to fix database issue
      await moduleService.forceReuploadModules()
      
      this.modules = moduleService.getModules()
      
    } catch (error) {
      console.error('❌ Error initializing CreateRoomModal:', error)
    }
  },
  data() {
    return {
      isCreating: false,
      errorMessage: '',
      formData: {
        activityName: '',
        studentYear: '3rd', // Default to 3rd year since it's hidden
        section: '',
        gameMode: '',
        duration: '',
        wordCount: '',
        module: '',
        difficulty: ''
      },
      years: [
     
        
        { value: '3rd', label: '3rd Year' },
        
      ],
      sections: {
      
        
        '3rd': ['BSN-3A', 'BSN-3B', 'BSN-3C', 'BSN-3D'],
       
      },
      durations: [
        { value: 1, label: '1 minute' },
        { value: 3, label: '3 minutes' },
        { value: 5, label: '5 minutes' },
        { value: 10, label: '10 minutes' },
        { value: 15, label: '15 minutes' }
      ],
      modules: [], // Will be populated from moduleService
      difficulties: [
        { 
          value: 'easy', 
          label: 'Easy', 
          description: 'Basic terminology and simple procedures',
          class: 'difficulty-easy',
          icon: 'fas fa-smile'
        },
        { 
          value: 'normal', 
          label: 'Normal', 
          description: 'Standard nursing procedures and terminology',
          class: 'difficulty-normal',
          icon: 'fas fa-meh'
        },
        { 
          value: 'hard', 
          label: 'Hard', 
          description: 'Complex procedures and advanced terminology',
          class: 'difficulty-hard',
          icon: 'fas fa-fire'
        }
      ]
    }
  },
  computed: {
    availableSections() {
      const sections = this.sections[this.formData.studentYear] || []
      console.log('🏫 Available sections for year', this.formData.studentYear, ':', sections)
      return sections
    },
    isFormValid() {
      const hasRequired = !!(
        this.formData.activityName &&
        this.formData.studentYear &&
        this.formData.section &&
        this.formData.gameMode &&
        this.formData.module
      )
      
      if (this.formData.gameMode === 'timed') {
        const duration = parseInt(this.formData.duration)
        const isValidDuration = duration > 0
        return hasRequired && isValidDuration
      } else if (this.formData.gameMode === 'word-count') {
        const wordCount = parseInt(this.formData.wordCount)
        const isValidWordCount = wordCount > 0
        return hasRequired && isValidWordCount
      }
      
      return false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },
    onYearChange() {
      // Reset section when year changes
      this.formData.section = ''
    },
    async createRoom() {
      if (!this.isFormValid) return

      try {
        // Show loading state
        this.isCreating = true

        // Map form data to API format
        const roomData = {
          activityName: this.formData.activityName,
          section: this.formData.section,
          yearLevel: this.formData.studentYear,
          mode: this.formData.gameMode === 'timed' ? 'Timed' : 'Word Count Challenge',
          duration: this.formData.gameMode === 'timed' ? this.formData.duration : null,
          wordCount: this.formData.gameMode === 'word-count' ? this.formData.wordCount : null,
          module: this.getModuleLabel(this.formData.module),
          difficultyLevel: this.getDifficultyLabel(this.formData.difficulty),
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
        console.error('Error creating room:', error)
        
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
        studentYear: '3rd', // Keep default value when resetting
        section: '',
        gameMode: '',
        duration: '',
        wordCount: '',
        module: '',
        difficulty: ''
      }
      this.errorMessage = ''
      this.isCreating = false
    },
    
    // Helper methods for API data mapping
    getModuleLabel(moduleId) {
      const module = this.modules.find(m => m.id === moduleId)
      return module ? module.label : moduleId
    },
    
    getDifficultyLabel(difficultyValue) {
      const difficultyMap = {
        'easy': 'Easy',
        'normal': 'Normal', 
        'hard': 'Hard'
      }
      return difficultyMap[difficultyValue] || difficultyValue
    },
    
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
    },
    'formData.studentYear'(newYear, oldYear) {
      if (newYear !== oldYear && this.formData.section) {
        this.formData.section = ''
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
  max-width: 600px;
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

/* Radio Group Styles */
.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-item {
  flex: 1;
}

.radio-input {
  display: none;
}

.radio-label {
  display: block;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 500;
}

.radio-input:checked + .radio-label {
  border-color: var(--accent-color);
  background: var(--accent-color-alpha);
  color: var(--accent-color);
}

.radio-label:hover {
  border-color: var(--accent-color);
  background: var(--accent-color-alpha-light);
}

/* Difficulty Buttons */
.difficulty-buttons {
  display: flex;
  gap: 0.75rem;
}

.difficulty-btn {
  flex: 1;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
}

.difficulty-easy {
  color: var(--success-color);
}

.difficulty-easy.active {
  border-color: var(--success-color);
  background: var(--success-color-alpha);
}

.difficulty-normal {
  color: var(--warning-color);
}

.difficulty-normal.active {
  border-color: var(--warning-color);
  background: var(--warning-color-alpha);
}

.difficulty-hard {
  color: var(--error-color);
}

.difficulty-hard.active {
  border-color: var(--error-color);
  background: var(--error-color-alpha);
}

.difficulty-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  transform: translateY(-2px);
}

.btn-primary {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  box-shadow: var(--shadow-accent);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Error message styles */
.error-message {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--error-color-alpha);
  border: 1px solid var(--error-color);
  border-radius: 8px;
  color: var(--error-color);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Loading spinner animation */
.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .radio-group,
  .difficulty-buttons {
    flex-direction: column;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}

/* Form validation feedback */
.form-control:invalid {
  border-color: var(--error-color);
}

.form-control:valid {
  border-color: var(--success-color);
}

/* Smooth transitions for dynamic content */
.form-group {
  transition: all 0.3s ease;
}

/* Custom scrollbar for modal */
.modal-container::-webkit-scrollbar {
  width: 6px;
}

.modal-container::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 10px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 10px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color-dark);
}

/* Dark mode specific styling for select options */
[data-theme="dark"] .form-control option {
  background: var(--bg-secondary);
  color: white;
}

[data-theme="dark"] .form-control select option {
  background: var(--bg-secondary);
  color: white;
}

/* Dark mode specific styling for Activity Name input and other form controls */
[data-theme="dark"] .form-control {
  background: var(--bg-secondary);
  color: white;
  border-color: var(--border-primary);
}

[data-theme="dark"] .form-control:focus {
  background: var(--bg-tertiary);
  color: white;
  border-color: var(--accent-primary);
}

[data-theme="dark"] .form-control::placeholder {
  color: var(--text-secondary);
}

/* Dark mode specific styling for Game Mode radio buttons */
[data-theme="dark"] .radio-label {
  background: var(--bg-secondary);
  color: white;
  border-color: var(--border-primary);
}

[data-theme="dark"] .radio-input:checked + .radio-label {
  background: var(--accent-gradient-alpha);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  font-weight: 600;
}

[data-theme="dark"] .radio-label:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* Light mode specific styling for Game Mode radio buttons */
[data-theme="light"] .radio-label {
  background: #f8fafc;
  color: #334155;
  border-color: #e2e8f0;
}

[data-theme="light"] .radio-input:checked + .radio-label {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #3b82f6;
  font-weight: 600;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

[data-theme="light"] .radio-label:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #1d4ed8;
}
</style>