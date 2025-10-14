<template>
  <div class="admin-panel">
    <!-- Show login if not authenticated -->
    <AdminLogin 
      v-if="!isAuthenticated" 
      @login-success="handleLoginSuccess"
    />
    
    <!-- Show dashboard if authenticated -->
    <div v-else class="admin-content">
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
              
              <div class="dropdown">
                <button 
                  class="btn btn-outline-light btn-sm dropdown-toggle" 
                  type="button" 
                  data-bs-toggle="dropdown"
                >
                  <i class="fas fa-user-circle me-1"></i>
                  Account
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" href="#" @click="showProfile">
                      <i class="fas fa-user me-2"></i>
                      Profile
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click="showSettings">
                      <i class="fas fa-cog me-2"></i>
                      Settings
                    </a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item text-danger" href="#" @click="confirmLogout">
                      <i class="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
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
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger"
              @click="handleLogout"
            >
              <i class="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div 
      v-if="showLogoutModal" 
      class="modal-backdrop fade show"
      @click="showLogoutModal = false"
    ></div>
  </div>
</template>

<script>
import AdminLogin from '../components/AdminLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import sessionService from '../services/sessionService';
import { auth } from '../firebase/init';
import { onAuthStateChanged } from 'firebase/auth';

export default {
  name: 'AdminPanel',
  components: {
    AdminLogin,
    AdminDashboard
  },
  
  data() {
    return {
      isAuthenticated: false,
      adminSession: null,
      currentUser: null,
      showLogoutModal: false
    };
  },
  
  mounted() {
    this.checkAuthStatus();
  },
  
  methods: {
    checkAuthStatus() {
      // Set up Firebase Auth state listener
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUser = user;
          
          // Get admin session from Firestore
          const adminSession = await sessionService.getAdminSession();
          if (adminSession) {
            this.adminSession = adminSession;
            this.isAuthenticated = true;
          } else {
            // No valid session found
            this.clearSession();
          }
        } else {
          // User not authenticated
          this.clearSession();
        }
      });
    },
    
    handleLoginSuccess(adminSession) {
      this.adminSession = adminSession;
      this.isAuthenticated = true;
      
      // Log admin login
      console.log(`Admin logged in: ${adminSession.name} (${adminSession.id})`);
    },
    
    confirmLogout() {
      this.showLogoutModal = true;
    },
    
    handleLogout() {
      this.clearSession();
      this.showLogoutModal = false;
      
      // Show logout message
      this.$toast?.success?.('Logged out successfully');
      
      console.log('Admin logged out');
    },
    
    async clearSession() {
      try {
        // Destroy session in Firestore
        await sessionService.destroyAdminSession();
        
        // Sign out from Firebase Auth
        if (auth.currentUser) {
          await auth.signOut();
        }
      } catch (error) {
        console.error('Error clearing session:', error);
      }
      
      this.adminSession = null;
      this.currentUser = null;
      this.isAuthenticated = false;
    },
    
    showProfile() {
      // Implement profile view
      this.$toast?.info?.('Profile feature coming soon');
    },
    
    showSettings() {
      // Implement settings view
      this.$toast?.info?.('Settings feature coming soon');
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

/* Animation for content transition */
.admin-content {
  animation: fadeIn 0.5s ease-in-out;
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