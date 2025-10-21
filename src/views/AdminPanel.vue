<template>
  <div class="admin-panel">
    <!-- Loading state while checking authentication -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4 class="mt-3">Loading Admin Panel...</h4>
        <p class="text-muted">Please wait while we verify your credentials</p>
      </div>
    </div>

    <!-- Show dashboard if authenticated -->
    <div v-else-if="isAuthenticated" class="admin-content">
      <!-- Admin Navigation Bar -->
      <nav class="admin-navbar">
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center">
            <div class="navbar-brand">
              <i class="fas fa-user-shield me-2"></i>
              <strong>NurseScript Admin</strong>
            </div>
            
            <div class="d-flex align-items-center">
              <div class="admin-info me-3">
                <span class="admin-name">{{ adminSession.name }}</span>
                <small class="text-muted d-block">{{ adminSession.id }}</small>
              </div>
              
              <button 
                class="btn btn-outline-light btn-sm" 
                type="button" 
                @click="confirmLogout"
                :disabled="isLoggingOut"
              >
                <span v-if="isLoggingOut">
                  <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  Logging out...
                </span>
                <span v-else>
                  <i class="fas fa-sign-out-alt me-2"></i>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <!-- Admin Dashboard -->
      <AdminDashboard />
    </div>

    <!-- Logout Confirmation Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showLogoutModal }" 
      :style="{ display: showLogoutModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-sign-out-alt me-2"></i>
              Confirm Logout
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showLogoutModal = false"
              :disabled="isLoggingOut"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to logout from the admin panel?</p>
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>
              You will need to login again to access the admin dashboard.
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showLogoutModal = false"
              :disabled="isLoggingOut"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger"
              @click="handleLogout"
              :disabled="isLoggingOut"
            >
              <span v-if="isLoggingOut">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                Logging out...
              </span>
              <span v-else>
                <i class="fas fa-sign-out-alt me-2"></i>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div 
      v-if="showLogoutModal" 
      class="modal-backdrop fade show"
      @click="!isLoggingOut && (showLogoutModal = false)"
    ></div>
  </div>
</template>

<script>
import AdminDashboard from '../components/AdminDashboard.vue';
import sessionService from '../services/sessionService';
import { auth } from '../firebase/init';
import { onAuthStateChanged } from 'firebase/auth';

export default {
  name: 'AdminPanel',
  components: {
    AdminDashboard
  },
  
  data() {
    return {
      isLoading: true,
      isAuthenticated: false,
      adminSession: null,
      currentUser: null,
      showLogoutModal: false,
      isLoggingOut: false,
      authUnsubscribe: null
    };
  },
  
  mounted() {
    this.checkAuthStatus();
  },
  
  beforeUnmount() {
    // Clean up Firebase auth listener
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  },
  
  methods: {
    checkAuthStatus() {
      // Set up Firebase Auth state listener
      this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            this.currentUser = user;
            
            // Get admin session from Firestore
            const adminSession = await sessionService.getAdminSession();
            if (adminSession) {
              this.adminSession = adminSession;
              this.isAuthenticated = true;
              this.isLoading = false;
            } else {
              // No valid session found, redirect to main login
              this.isLoading = false;
              this.$router.push('/login');
            }
          } else {
            // User not authenticated, redirect to main login
            this.isLoading = false;
            if (this.$router.currentRoute.value.path !== '/login') {
              this.$router.push('/login');
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // On error, redirect to login
          this.isLoading = false;
          this.$router.push('/login');
        }
      });
    },
    

    
    confirmLogout() {
      this.showLogoutModal = true;
    },
    
    async handleLogout() {
      try {
        // Set loading state
        this.isLoggingOut = true;
        
        await this.clearSession();
        this.showLogoutModal = false;
        
        // Show logout message
        this.$toast?.success?.('Logged out successfully');
        
        console.log('Admin logged out');
        
        // Redirect to main login page
        this.$router.push('/login');
      } catch (error) {
        console.error('Error during logout:', error);
        this.$toast?.error?.('Error during logout');
        // Still redirect even if there's an error
        this.$router.push('/login');
      } finally {
        // Reset loading state
        this.isLoggingOut = false;
      }
    },
    
    async clearSession() {
      try {
        // Run session destruction and Firebase signout in parallel for faster logout
        const promises = [];
        
        // Destroy session in Firestore
        promises.push(sessionService.destroyAdminSession());
        
        // Sign out from Firebase Auth
        if (auth.currentUser) {
          promises.push(auth.signOut());
        }
        
        // Wait for both operations to complete
        await Promise.all(promises);
      } catch (error) {
        console.error('Error clearing session:', error);
        // Continue with cleanup even if there's an error
      }
      
      // Clear local state
      this.adminSession = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isLoading = false;
    }
  },
  
  // Navigation guard to prevent unauthorized access
  async beforeRouteEnter(to, from, next) {
    // Check if accessing admin route
    if (to.path.startsWith('/admin')) {
      try {
        // Check Firebase Auth state
        const user = auth.currentUser;
        if (!user) {
          next('/admin/login');
          return;
        }
        
        // Check if valid admin session exists in Firestore
        const adminSession = await sessionService.getAdminSession();
        if (!adminSession) {
          next('/admin/login');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        next('/admin/login');
        return;
      }
    }
    
    next();
  }
};
</script>

<style scoped>
.admin-panel {
  min-height: 100vh;
}

.admin-content {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.admin-navbar {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.admin-info {
  text-align: right;
}

.admin-name {
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
}

.admin-info small {
  font-size: 0.8rem;
  opacity: 0.8;
}

.dropdown-toggle {
  border-color: rgba(255,255,255,0.3);
  color: white;
}

.dropdown-toggle:hover,
.dropdown-toggle:focus {
  background-color: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
  color: white;
}

.dropdown-menu {
  border: none;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  margin-top: 0.5rem;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.text-danger:hover {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545 !important;
}

.modal-content {
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  border-bottom: 1px solid #e9ecef;
  border-radius: 12px 12px 0 0;
}

.alert-info {
  border-left: 4px solid #0dcaf0;
  background-color: rgba(13, 202, 240, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-info {
    display: none;
  }
  
  .navbar-brand {
    font-size: 1.1rem;
  }
}

/* Loading container styles */
.loading-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-content {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-content h4 {
  color: white;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.loading-content p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3em;
}

/* Animation for content transition */
.admin-content {
  animation: fadeIn 0.5s ease-in-out;
}

.loading-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>