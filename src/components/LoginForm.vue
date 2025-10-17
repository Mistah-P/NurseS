<template>
  <div class="login-container">
    <!-- Animated Background -->
    <div class="animated-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- Login Card -->
    <div class="login-card-container">
      <div class="login-card">
        <!-- Header -->
        <div class="card-header">
          <router-link to="/" class="back-button">
            <i class="fas fa-arrow-left"></i>
          </router-link>
          <div class="logo-section">
            <div class="logo-icon">
              <i class="fas fa-heartbeat"></i>
            </div>
            <span class="logo-text">NurseScript</span>
          </div>
        </div>

        <!-- Welcome Section -->
        <div class="welcome-section">
          <h1 class="welcome-title">Welcome Back!</h1>
          <p class="welcome-subtitle">Sign in to continue your medical typing journey</p>
        </div>

        <!-- Error Alert -->
        <transition name="slide-down">
          <div v-if="errorMessage" class="error-alert">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="error-content">
              <span class="error-text">{{ errorMessage }}</span>
            </div>
            <button class="error-close" @click="clearError">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </transition>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email" class="form-label">
              <i class="fas fa-envelope"></i>
              Email Address
            </label>
            <div class="input-container">
              <input
                type="email"
                id="email"
                class="form-input"
                v-model="email"
                placeholder="Enter your email"
                required
                :disabled="isLoading"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
              <div class="input-border"></div>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password" class="form-label">
              <i class="fas fa-lock"></i>
              Password
            </label>
            <div class="input-container password-container">
              <input
                :type="passwordVisible ? 'text' : 'password'"
                id="password"
                class="form-input"
                v-model="password"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                :disabled="isLoading"
                @keyup.enter="handleLogin"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                :disabled="isLoading"
                @click="passwordVisible = !passwordVisible"
              >
                <i :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
              <div class="input-border"></div>
            </div>
          </div>

          <!-- Login Button -->
          <button type="submit" class="login-button" :disabled="isLoading">
            <div class="button-content">
              <div v-if="isLoading" class="loading-spinner">
                <div class="spinner"></div>
              </div>
              <i v-else class="fas fa-sign-in-alt"></i>
              <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
            </div>
            <div class="button-glow"></div>
          </button>
        </form>

        <!-- Footer -->
        <div class="card-footer">
          <p class="register-prompt">
            Don't have an account?
            <router-link to="/register" class="register-link">Create Account</router-link>
          </p>
          

        </div>
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
    
    onInputFocus(event) {
      event.target.parentElement.classList.add('focused');
    },
    
    onInputBlur(event) {
      event.target.parentElement.classList.remove('focused');
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
/* Import fonts and icons */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-color);
  opacity: 0.1;
  animation: float 15s infinite linear;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: -3s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 80%;
  left: 30%;
  animation-delay: -6s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  top: 10%;
  right: 25%;
  animation-delay: -9s;
}

.shape-5 {
  width: 90px;
  height: 90px;
  top: 40%;
  left: 70%;
  animation-delay: -12s;
}

@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 30%, var(--accent-color-alpha) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, var(--accent-color-alpha) 0%, transparent 50%);
  z-index: -1;
}

/* Login Card */
.login-card-container {
  width: 100%;
  max-width: 450px;
  animation: slideInUp 0.8s ease-out;
}

.login-card {
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 25px 50px var(--shadow-dark);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
  opacity: 0.5;
}

/* Header */
.card-header {
  
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-button {
  width: 44px;
  height: 44px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: var(--accent-color);
  color: white;
  transform: translateX(-2px);
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--accent-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-badge {
  background: var(--accent-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  animation: slideInUp 0.8s ease-out 0.2s both;
}

.welcome-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  animation: slideInUp 0.8s ease-out 0.4s both;
}

/* Error Alert */
.error-alert {
  background: var(--error-color);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.error-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-text {
  font-weight: 500;
  font-size: 0.9rem;
}

.error-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Form */
.login-form {
  animation: slideInUp 0.8s ease-out 0.6s both;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.form-label i {
  color: var(--accent-color);
  width: 16px;
}

.input-container {
  position: relative;
  transition: all 0.3s ease;
}

.form-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  font-size: 1rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px var(--accent-color-alpha);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.password-container .form-input {
  padding-right: 3.5rem;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  color: var(--accent-color);
  background: var(--accent-color-alpha);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
  border-radius: 1px;
}

.input-container.focused .input-border {
  width: 100%;
}

/* Login Button */
.login-button {
  width: 100%;
  background: var(--accent-gradient);
  border: none;
  border-radius: 12px;
  padding: 1.25rem;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px var(--accent-color-alpha);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
}

.button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-button:hover:not(:disabled) .button-glow {
  left: 100%;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Footer */
.card-footer {
  text-align: center;
  animation: slideInUp 0.8s ease-out 0.8s both;
}

.register-prompt {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.register-link {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: var(--text-primary);
}



/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-down-enter-active {
  transition: all 0.3s ease-out;
}

.slide-down-leave-active {
  transition: all 0.3s ease-in;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 2rem;
  }
  
  .welcome-title {
    font-size: 1.75rem;
  }
  

}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .card-header {
    margin-bottom: 1.5rem;
  }
  
  .form-input {
    padding: 0.875rem 1rem;
  }
  
  .login-button {
    padding: 1rem;
  }
}
</style>
