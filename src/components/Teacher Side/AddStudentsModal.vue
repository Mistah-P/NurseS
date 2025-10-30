<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>Add Students to Your Class</h2>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Search Section -->
        <div class="search-section">
          <div class="search-input-container">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="searchTerm"
              @input="handleSearchInput"
              placeholder="Search students by name or email..."
              class="search-input"
              :disabled="isSearching"
            />
            <div v-if="isSearching" class="search-loading">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
          
          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="search-results">
            <div class="results-header">
              <span>{{ searchResults.length }} student(s) found</span>
            </div>
            <div class="results-list">
              <div
                v-for="student in searchResults"
                :key="student.id"
                class="result-item"
                :class="{ 'already-selected': isStudentSelected(student.id) }"
                @click="selectStudent(student)"
              >
                <div class="student-avatar">
                  <span>{{ student.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="student-info">
                  <div class="student-name">{{ student.name }}</div>
                  <div class="student-email">{{ student.email }}</div>
                  <div class="student-stats" v-if="student.stats">
                    <span>{{ student.stats.totalTests || 0 }} tests completed</span>
                    <span v-if="student.stats.averageWPM">• {{ student.stats.averageWPM }} avg WPM</span>
                  </div>
                </div>
                <div class="selection-indicator">
                  <i v-if="isStudentSelected(student.id)" class="fas fa-check-circle selected"></i>
                  <i v-else class="fas fa-plus-circle"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="searchTerm.length >= 2 && !isSearching" class="no-results">
            <i class="fas fa-user-slash"></i>
            <p>No students found matching "{{ searchTerm }}"</p>
            <small>Try searching with a different name or email</small>
          </div>

          <!-- Search Instructions -->
          <div v-else-if="searchTerm.length < 2" class="search-instructions">
            <i class="fas fa-info-circle"></i>
            <p>Type at least 2 characters to search for students</p>
          </div>
        </div>

        <!-- Selected Students Section -->
        <div v-if="selectedStudents.length > 0" class="selected-section">
          <div class="section-header">
            <h3>Selected Students ({{ selectedStudents.length }})</h3>
            <button class="clear-all-btn" @click="clearAllSelections">
              <i class="fas fa-trash"></i>
              Clear All
            </button>
          </div>
          
          <div class="selected-list">
            <div
              v-for="student in selectedStudents"
              :key="student.id"
              class="selected-item"
            >
              <div class="student-avatar small">
                <span>{{ student.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-email">{{ student.email }}</div>
              </div>
              <button class="remove-btn" @click="removeStudent(student.id)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty Selection State -->
        <div v-else class="empty-selection">
          <i class="fas fa-users"></i>
          <p>No students selected yet</p>
          <small>Search and click on students to add them to your class</small>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          @click="addSelectedStudents"
          :disabled="selectedStudents.length === 0 || isAdding"
        >
          <i v-if="isAdding" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-user-plus"></i>
          {{ isAdding ? 'Adding...' : `Add ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api';

export default {
  name: 'AddStudentsModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchTerm: '',
      searchResults: [],
      selectedStudents: [],
      isSearching: false,
      isAdding: false,
      searchTimeout: null
    };
  },
  watch: {
    show(newValue) {
      if (newValue) {
        this.resetModal();
      }
    }
  },
  methods: {
    resetModal() {
      this.searchTerm = '';
      this.searchResults = [];
      this.selectedStudents = [];
      this.isSearching = false;
      this.isAdding = false;
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }
    },

    handleOverlayClick() {
      this.closeModal();
    },

    closeModal() {
      this.$emit('close');
    },

    handleSearchInput() {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // If search term is too short, clear results
      if (this.searchTerm.length < 2) {
        this.searchResults = [];
        return;
      }

      // Set timeout for search to avoid too many API calls
      this.searchTimeout = setTimeout(() => {
        this.performSearch();
      }, 300);
    },

    async performSearch() {
      if (this.searchTerm.length < 2) return;

      try {
        this.isSearching = true;
        const result = await api.teacherAPI.searchStudents(this.searchTerm, 10);
        
        if (result.success) {
          this.searchResults = result.data || [];
        } else {
          throw new Error(result.message || 'Failed to search students');
        }
      } catch (error) {
        console.error('Error searching students:', error);
        this.$emit('error', 'Failed to search students. Please try again.');
        this.searchResults = [];
      } finally {
        this.isSearching = false;
      }
    },

    isStudentSelected(studentId) {
      return this.selectedStudents.some(s => s.id === studentId);
    },

    selectStudent(student) {
      if (this.isStudentSelected(student.id)) {
        // Student already selected, remove them
        this.removeStudent(student.id);
      } else {
        // Add student to selection
        this.selectedStudents.push({
          id: student.id,
          name: student.name,
          email: student.email,
          stats: student.stats
        });
      }
    },

    removeStudent(studentId) {
      this.selectedStudents = this.selectedStudents.filter(s => s.id !== studentId);
    },

    clearAllSelections() {
      this.selectedStudents = [];
    },

    async addSelectedStudents() {
      if (this.selectedStudents.length === 0) return;

      try {
        this.isAdding = true;
        
        // Emit the selected students to parent component
        this.$emit('students-selected', this.selectedStudents);
        
        // Close modal after successful addition
        this.closeModal();
        
      } catch (error) {
        console.error('Error adding students:', error);
        this.$emit('error', 'Failed to add students. Please try again.');
      } finally {
        this.isAdding = false;
      }
    }
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
}

.search-section {
  margin-bottom: 24px;
}

.search-input-container {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.search-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #3b82f6;
}

.search-results {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.results-header {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background: #f9fafb;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.already-selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.student-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.student-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.student-stats {
  font-size: 0.75rem;
  color: #9ca3af;
}

.selection-indicator {
  margin-left: 12px;
  font-size: 1.25rem;
}

.selection-indicator .selected {
  color: #10b981;
}

.selection-indicator .fa-plus-circle {
  color: #6b7280;
}

.no-results,
.search-instructions,
.empty-selection {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-results i,
.search-instructions i,
.empty-selection i {
  font-size: 2rem;
  margin-bottom: 12px;
  color: #d1d5db;
}

.selected-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.clear-all-btn {
  background: none;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 12px;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #fee2e2;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>