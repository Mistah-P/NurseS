<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-plus-circle me-2"></i>
          Choose Room Type
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="selection-description">
          Select the type of room you want to create:
        </p>
        
        <div class="room-type-options">
          <!-- Typing Test Option -->
          <div class="room-type-card" @click="selectRoomType('typing-test')">
            <div class="card-icon typing-test">
              <i class="fas fa-keyboard"></i>
            </div>
            <div class="card-content">
              <h4>Typing Test</h4>
              <p>Create a typing practice session with modules, difficulty levels, and timing options.</p>
              <ul class="feature-list">
                <li><i class="fas fa-check"></i> Module selection</li>
                <li><i class="fas fa-check"></i> Difficulty levels</li>
                <li><i class="fas fa-check"></i> Timed or word count modes</li>
                <li><i class="fas fa-check"></i> Live leaderboard</li>
              </ul>
            </div>
          </div>

          <!-- AI Patient Option -->
          <div class="room-type-card" @click="selectRoomType('ai-patient')">
            <div class="card-icon ai-patient">
              <i class="fas fa-user-md"></i>
            </div>
            <div class="card-content">
              <h4>AI Patient</h4>
              <p>Create an AI-powered patient interaction session for nursing practice.</p>
              <ul class="feature-list">
                <li><i class="fas fa-check"></i> AI patient simulation</li>
                <li><i class="fas fa-check"></i> Interactive scenarios</li>
                <li><i class="fas fa-check"></i> Real-time responses</li>
                <li><i class="fas fa-check"></i> Practice-focused environment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomTypeSelectionModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    selectRoomType(roomType) {
      this.$emit('room-type-selected', roomType)
      this.closeModal()
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
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
  max-width: 800px;
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

.selection-description {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.room-type-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.room-type-card {
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

.room-type-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-4px);
  box-shadow: 0 10px 30px var(--shadow-medium);
}

.room-type-card:hover .card-icon {
  transform: scale(1.1);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.card-icon.typing-test {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-icon.ai-patient {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.card-icon i {
  font-size: 1.5rem;
}

.card-content h4 {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card-content p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-list li i {
  color: var(--accent-color);
  font-size: 0.8rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .room-type-options {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
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
  --accent-color: #667eea;
  --shadow-dark: rgba(0, 0, 0, 0.15);
  --shadow-medium: rgba(0, 0, 0, 0.1);
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