<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="logo-section">
            <div class="logo-icon">
              <i class="fas fa-heartbeat"></i>
            </div>
            <span class="logo-text">NurseScript</span>
          </div>
          <div class="admin-section">
            <i class="fas fa-user-shield fa-2x admin-icon"></i>
            <h2 class="login-title">Admin Portal</h2>
            <p class="login-subtitle">Administration Dashboard</p>
          </div>
        </div>

        <!-- Login Form -->
        <div class="login-body">
          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="adminId" class="form-label">Admin ID</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  class="form-control"
                  id="adminId"
                  v-model="credentials.adminId"
                  placeholder="Enter your admin ID"
                  required
                  :disabled="loading"
                >
              </div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-lock"></i>
                </span>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  id="password"
                  v-model="credentials.password"
                  placeholder="Enter your password"
                  required
                  :disabled="loading"
                >
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="showPassword = !showPassword"
                  :disabled="loading"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              class="btn btn-primary btn-lg w-100"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fas fa-sign-in-alt me-2"></i>
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p class="text-muted text-center">
            <i class="fas fa-shield-alt me-1"></i>
            Secure Admin Access Only
          </p>
        </div>
      </div>
    </div>

    <!-- Background Animation -->
    <div class="background-animation">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
  </div>
</template>

<script>
import sessionService from '../services/sessionService';
import { auth } from '../firebase/init';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default {
  name: 'AdminLogin',
  data() {
    return {
      credentials: {
        adminId: '',
        password: ''
      },
      showPassword: false,
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      if (!this.credentials.adminId || !this.credentials.password) {
        this.error = 'Please enter both admin ID and password';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        // Hardcoded admin credentials (same as LoginForm.vue)
        const validAdmins = [
          { adminId: 'admin-001', password: 'admin123', name: 'System Administrator', email: 'admin@nursescript.com' },
          { adminId: 'admin-002', password: 'admin456', name: 'Head Administrator', email: 'head.admin@nursescript.com' }
        ];

        const admin = validAdmins.find(a => 
          a.adminId === this.credentials.adminId && a.password === this.credentials.password
        );

        if (!admin) {
          this.error = 'Invalid admin ID or password';
          return;
        }

        // Create Firebase Auth user if doesn't exist, otherwise sign in
        try {
          // Try to sign in first
          await signInWithEmailAndPassword(auth, admin.email, this.credentials.password);
        } catch (signInError) {
          if (signInError.code === 'auth/user-not-found') {
            // Create new Firebase user for admin
            await createUserWithEmailAndPassword(auth, admin.email, this.credentials.password);
          } else {
            throw signInError;
          }
        }

        // Create admin session in Firestore
        const adminSession = await sessionService.createAdminSession({
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email
        });

        // Emit login success with session data
        this.$emit('login-success', adminSession);

      } catch (error) {
        console.error('Admin login error:', error);
        this.error = 'Login failed. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    }
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  position: relative;
  z-index: 10;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.logo-text {
  font-size: 1.5rem;
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

.admin-section {
  text-align: center;
}

.admin-icon {
  color: #667eea;
  margin-bottom: 0.5rem;
}

.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 0;
}

.login-body {
  padding: 1.5rem 2rem;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.form-control {
  border-color: #dee2e6;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  transform: none;
}

.alert-danger {
  border: none;
  border-radius: 10px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.login-footer {
  padding: 1rem 2rem 2rem;
  text-align: center;
}

.login-footer p {
  margin-bottom: 0;
  font-size: 0.85rem;
}

/* Background Animation */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 30%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 576px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .login-body {
    padding: 1rem 1.5rem;
  }
  
  .login-footer {
    padding: 1rem 1.5rem 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}

/* Input Focus Animation */
.form-control:focus + .input-group-text {
  border-color: #667eea;
  background-color: rgba(102, 126, 234, 0.1);
}

/* Button Loading State */
.btn:disabled .spinner-border {
  width: 1rem;
  height: 1rem;
}
</style>