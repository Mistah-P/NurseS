<template>
  <div class="d-flex justify-content-center align-items-center vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div class="card shadow-lg border-0" style="width: 420px; border-radius: 16px;">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 class="card-title mb-1 fw-bold text-dark">Welcome back!</h4>
            <p class="text-muted small mb-0">Please sign in to your account</p>
          </div>
          <router-link to="/" class="btn-close" aria-label="Close"></router-link>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ errorMessage }}
          <button type="button" class="btn-close" @click="clearError" aria-label="Close"></button>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label text-uppercase small fw-semibold text-secondary">Email Address</label>
            <input
              type="email"
              id="email"
              class="form-control custom-input"
              v-model="email"
              placeholder="name@email.com"
              required
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
                autocomplete="current-password"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
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
            <span v-if="isLoading">Logging in...</span>
            <span v-else>
              <i class="fas fa-sign-in-alt me-2"></i>
              Login
            </span>
          </button>
        </form>

        <p class="text-center mt-4 mb-0 text-muted small">
          Don't have an account?
          <router-link to="/register" class="text-decoration-none fw-semibold">Register</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase/init";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import sessionService from "../services/sessionService";

export default {
  name: 'LoginForm',
  data() {
    return {
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
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
        'auth/missing-password': 'Please enter your password.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/email-already-in-use': 'An account with this email already exists.'
      };
      
      // Return specific error message or generic fallback
      return errorMessages[error.code] || error.message || 'Login failed. Please try again.';
    },

    async handleLogin() {
      // Clear previous errors and start loading
      this.clearError();
      this.isLoading = true;

      try {
        // Validate inputs
        if (!this.email.trim()) {
          throw new Error('Please enter your email address.');
        }
        if (!this.password.trim()) {
          throw new Error('Please enter your password.');
        }

        // Check for admin account
        if (this.email === 'admin@nursescript.com' && this.password === 'admin123') {
          // Create Firebase Auth user for admin if doesn't exist
          try {
            await createUserWithEmailAndPassword(auth, this.email, this.password);
          } catch (authError) {
            // If user already exists, sign in
            if (authError.code === 'auth/email-already-in-use') {
              await signInWithEmailAndPassword(auth, this.email, this.password);
            } else {
              throw authError;
            }
          }
          
          // Create admin session in Firestore
          const adminSession = await sessionService.createAdminSession('admin-001', this.email);
          console.log("Admin logged in with session:", adminSession.sessionId);
          this.$router.push('/admin');
          return;
        }

        // Check for temporary teacher account
        if (this.email === 'teacher@nursescript.com' && this.password === 'teacher123') {
          // Create Firebase Auth user for teacher if doesn't exist
          let user;
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
            user = userCredential.user;
          } catch (authError) {
            // If user already exists, sign in
            if (authError.code === 'auth/email-already-in-use') {
              const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
              user = userCredential.user;
            } else {
              throw authError;
            }
          }
          
          // Create teacher session in Firestore using Firebase UID
          const teacherSession = await sessionService.createTeacherSession(user.uid, this.email);
          console.log("Teacher logged in with session:", teacherSession.sessionId);
          
          // Add a small delay to ensure Firestore write completes before redirect
          await new Promise(resolve => setTimeout(resolve, 500));
          this.$router.push('/teacher-dashboard');
          return;
        }

        // Try to sign in with Firebase Auth (for all users including admin-created teachers)
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;
        
        // Check if this is a teacher account by looking up in Firestore
        const teacherQuery = query(collection(db, 'teachers'), where('email', '==', this.email));
        const teacherSnapshot = await getDocs(teacherQuery);
        
        if (!teacherSnapshot.empty) {
          // This is a teacher account
          const teacherDoc = teacherSnapshot.docs[0];
          const teacherData = teacherDoc.data();
          
          if (!teacherData.isActive) {
            throw new Error('Teacher account is deactivated. Please contact your administrator.');
          }
          
          // Create teacher session in Firestore using Firebase UID
          const teacherSession = await sessionService.createTeacherSession(user.uid, this.email);
          console.log("Teacher logged in with session:", teacherSession.sessionId);
          this.$router.push('/teacher-dashboard');
          return;
        }
        
        // Default to student login if not admin or teacher
        const studentSession = await sessionService.createStudentSession(user.uid);
        console.log("Student logged in with session:", studentSession.sessionId);
        this.$router.push('/user');
        
      } catch (error) {
        console.error('Login error:', error);
        this.errorMessage = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.card {
  font-family: 'Inter', sans-serif;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
}

.custom-input {
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.custom-input:focus {
  background-color: #ffffff;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.custom-input:disabled {
  background-color: #f1f3f4;
  color: #6c757d;
  cursor: not-allowed;
}

.custom-input::placeholder {
  color: #6c757d;
  font-weight: 400;
}

/* Make room for the eye button */
.has-toggle .custom-input {
  padding-right: 3rem;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.toggle-password:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.toggle-password:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.toggle-password:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-password svg {
  width: 18px;
  height: 18px;
}

.custom-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.custom-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.custom-btn:active:not(:disabled) {
  transform: translateY(0);
}

.custom-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
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
