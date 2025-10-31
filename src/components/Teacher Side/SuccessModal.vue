<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-content">
        <!-- Success Icon -->
        <div class="success-icon">
          <div class="success-circle">
            <i class="fas fa-check"></i>
          </div>
        </div>
        
        <!-- Success Message -->
        <div class="success-message">
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
        </div>
        
        <!-- Action Button -->
        <div class="modal-actions">
          <button class="btn btn-primary" @click="closeModal">
            <i class="fas fa-thumbs-up"></i>
            Great!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SuccessModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Success!'
    },
    message: {
      type: String,
      default: 'Operation completed successfully.'
    },
    autoClose: {
      type: Boolean,
      default: true
    },
    autoCloseDelay: {
      type: Number,
      default: 3000
    }
  },
  watch: {
    show(newValue) {
      if (newValue && this.autoClose) {
        this.startAutoClose();
      }
    }
  },
  methods: {
    handleOverlayClick() {
      this.closeModal();
    },

    closeModal() {
      this.$emit('close');
    },

    startAutoClose() {
      setTimeout(() => {
        if (this.show) {
          this.closeModal();
        }
      }, this.autoCloseDelay);
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
  z-index: 1001;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content {
  padding: 40px 32px 32px;
  text-align: center;
}

.success-icon {
  margin-bottom: 24px;
}

.success-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  animation: bounceIn 0.6s ease-out;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-circle i {
  font-size: 2rem;
  color: white;
  animation: checkMark 0.8s ease-out 0.2s both;
}

@keyframes checkMark {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-message {
  margin-bottom: 32px;
}

.success-message h2 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.success-message p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 480px) {
  .modal-container {
    margin: 20px;
    max-width: none;
  }
  
  .modal-content {
    padding: 32px 24px 24px;
  }
  
  .success-circle {
    width: 64px;
    height: 64px;
  }
  
  .success-circle i {
    font-size: 1.5rem;
  }
  
  .success-message h2 {
    font-size: 1.25rem;
  }
}
</style>