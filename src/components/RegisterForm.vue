<template>
  <div class="d-flex justify-content-center align-items-center vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div class="card shadow-lg border-0" style="width: 420px; border-radius: 16px;">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 class="card-title mb-1 fw-bold text-dark">Join NurseScript!</h4>
            <p class="text-muted small mb-0">Create your account to get started</p>
          </div>
          <router-link to="/" class="btn-close" aria-label="Close"></router-link>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
          <button type="button" class="btn-close" @click="clearError" aria-label="Close"></button>
        </div>

        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label for="name" class="form-label text-uppercase small fw-semibold text-secondary">Full Name</label>
            <input
              type="text"
              id="name"
              class="form-control custom-input"
              v-model="name"
              placeholder="Name"
              required
              autocomplete="name"
              :disabled="isLoading"
            />
          </div>

          <div class="mb-3">
            <label for="email" class="form-label text-uppercase small fw-semibold text-secondary">Email Address</label>
            <input
              type="email"
              id="email"
              class="form-control custom-input"
              v-model="email"
              placeholder="Email"
              required
              autocomplete="email"
              :disabled="isLoading"
            />
          </div>

          <div class="mb-4">
            <label for="password" class="form-label text-uppercase small fw-semibold text-secondary">Password</label>

            <!-- Password with show/hide toggle -->
            <div class="position-relative has-toggle">
              <input
                :type="passwordVisible ? 'text' : 'password'"
                id="password"
                class="form-control custom-input"
                v-model="password"
                placeholder="Password"
                required
                autocomplete="new-password"
                :disabled="isLoading"
                @keyup.enter="handleRegister"
              />

              <button
                type="button"
                class="toggle-password"
                :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                :title="passwordVisible ? 'Hide password' : 'Show password'"
                :disabled="isLoading"
                @click="passwordVisible = !passwordVisible"
              >
                <!-- Eye (show) -->
                <svg v-if="!passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>

                <!-- Eye off (hide) -->
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 3l18 18M10.585 10.585A3 3 0 0012 15a3 3 0 002.121-.879M9.88 9.88A3 3 0 0115 12m-3-7c4.477 0 8.268 2.943 9.542 7a10.056 10.056 0 01-4.478 5.21M6.223 6.223A9.963 9.963 0 0012 5c.686 0 1.354.07 2 .204M4.458 7A10.05 10.05 0 002 12c1.274 4.057 5.065 7 9.542 7 1.18 0 2.316-.18 3.375-.51"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn w-100 custom-btn position-relative" :disabled="isLoading">
            <!-- Loading Spinner -->
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span v-if="isLoading">Creating account...</span>
            <span v-else>
              <i class="fas fa-user-plus me-2"></i>
              Register
            </span>
          </button>
        </form>

        <p class="text-center mt-4 mb-0 text-muted small">
          Already have an account?
          <router-link :to="{ name: 'LoginForm' }" class="text-decoration-none fw-semibold">Log In</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from "../firebase/init"; // Firebase Authentication
import { db } from "../firebase/init"; // Firestore
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore methods

export default {
  name: 'RegisterForm',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      passwordVisible: false,
      isLoading: false,
      errorMessage: ''
    }
  },
  methods: {
    clearError() {
      this.errorMessage = '';
    },

    getErrorMessage(error) {
      // Map Firebase error codes to user-friendly messages
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists. Please try logging in instead.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Registration is currently disabled. Please contact support.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again.',
        'auth/too-many-requests': 'Too many registration attempts. Please try again later.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.'
      };
      
      // Return specific error message or generic fallback
      return errorMessages[error.code] || error.message || 'Registration failed. Please try again.';
    },

    async handleRegister() {
      // Clear previous errors and start loading
      this.clearError();
      this.isLoading = true;

      try {
        // Validate inputs
        if (!this.name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!this.email.trim()) {
          throw new Error('Please enter your email address.');
        }
        if (!this.password.trim()) {
          throw new Error('Please enter a password.');
        }
        if (this.password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: this.name.trim(),
          email: this.email.trim(),
          createdAt: new Date()
        });

        console.log("User registered and saved to Firestore:", user.uid);
        
        // Redirect to the user dashboard
        this.$router.push('/user');
        
      } catch (error) {
        console.error('Registration error:', error);
        this.errorMessage = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* Global styles */
* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Card styling with glass-morphism effect */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.card-title {
  color: #1a202c;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

/* Form inputs */
.custom-input {
  background: rgba(248, 250, 252, 0.8);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-input:focus {
  background: rgba(255, 255, 255, 0.95);
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.custom-input:disabled {
  background: rgba(226, 232, 240, 0.5);
  color: #a0aec0;
  cursor: not-allowed;
}

/* Make room for the eye button */
.has-toggle .custom-input {
  padding-right: 3rem;
}

/* Password toggle button */
.toggle-password {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #667eea;
  transition: all 0.2s ease;
}

.toggle-password:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-50%) scale(1.05);
}

.toggle-password:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.toggle-password:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(160, 174, 192, 0.1);
  color: #a0aec0;
}

.toggle-password svg {
  width: 18px;
  height: 18px;
}

/* Custom button with gradient */
.custom-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.custom-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.custom-btn:active:not(:disabled) {
  transform: translateY(0);
}

.custom-btn:disabled {
  background: linear-gradient(135deg, #a0aec0 0%, #cbd5e0 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(160, 174, 192, 0.3);
}

.custom-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.form-label {
  color: #495057;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.alert {
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.15);
}

.alert-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
}

.alert .btn-close {
  filter: brightness(0) invert(1);
  opacity: 0.8;
}

.alert .btn-close:hover {
  opacity: 1;
}

.btn-close {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.btn-close:hover {
  opacity: 1;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

/* Smooth animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Link styling */
a {
  color: #667eea;
  transition: color 0.2s ease;
}

a:hover {
  color: #5a6fd8;
  text-decoration: none !important;
}

/* Responsive design */
@media (max-width: 480px) {
  .card {
    width: 90% !important;
    margin: 0 20px;
  }
  
  .card-body {
    padding: 1.5rem !important;
  }
}

/* Loading state animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.custom-btn:disabled .spinner-border {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
