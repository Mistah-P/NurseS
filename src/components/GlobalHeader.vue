<template>
  <header class="global-header">
    <div class="header-content">
      <!-- Logo/Brand - Far Left -->
      <div class="brand">
        <i class="fas fa-stethoscope"></i>
        <span>NurseScript</span>
      </div>
      
      <!-- Navigation Links - Center -->
      <nav class="nav-links">
        <router-link to="/user" class="nav-link">
          <i class="fas fa-home"></i>
          Home
        </router-link>
        <router-link to="/practice-mode" class="nav-link">
          <i class="fas fa-keyboard"></i>
          Practice Mode
        </router-link>
        <router-link to="/ai-patient" class="nav-link">
          <i class="fas fa-robot"></i>
          AI Patient
        </router-link>
        <router-link to="/settings" class="nav-link">
          <i class="fas fa-cog"></i>
          Settings
        </router-link>
      </nav>
      
      <!-- User Info and Logout - Far Right -->
      <div class="user-section">
        <div class="user-info">
          <i class="fas fa-user-circle"></i>
          <span class="username">{{ username }}</span>
        </div>
        <button @click="logout" class="logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { auth, db } from '../firebase/init'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default {
  name: 'GlobalHeader',
  data() {
    return {
      username: 'Student',
      authUnsubscribe: null
    }
  },
  mounted() {
    // Set up authentication state listener
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchUserData(user)
      } else {
        this.username = 'Student'
      }
    })
  },
  beforeUnmount() {
    // Clean up the auth listener when component is destroyed
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
    }
  },
  methods: {
    async fetchUserData(user) {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            this.username = userData.firstName || userData.email || 'Student'
          } else {
            // If no user document exists, use email as fallback
            this.username = user.email || 'Student'
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Fallback to email if Firestore fetch fails
        if (user && user.email) {
          this.username = user.email
        }
      }
    },
    logout() {
      auth.signOut().then(() => {
        this.$router.push('/login')
      }).catch((error) => {
        console.error('Error signing out:', error)
      })
    }
  }
}
</script>

<style scoped>
.global-header {
  background: var(--bg-header);
  padding: 0;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  margin: 0 auto;
  padding: 1rem 2rem;
  width: 100%;
  /* Remove justify-content: space-between to allow flex properties to work */
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  flex: 0 0 auto; /* Don't grow or shrink, stay at natural size */
  margin-right: auto; /* Push everything else to the right */
  color:  #ffffff;;
}

.brand i {
  color: #4ade80;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex: 0 0 auto; /* Don't grow, stay centered */
  justify-content: center; /* Center the navigation links */
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: var(--bg-button);
  color: white;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto; /* Don't grow or shrink, stay at natural size */
  margin-left: auto; /* Push to the far right */
}


.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.user-info i {
  font-size: 1.2rem;
  color: var(--accent-success);
}

.username {
  font-weight: 500;
  color: var(--text-primary);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(245, 101, 101, 0.1);
  color: var(--accent-error);
  border: 1px solid var(--accent-error);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(245, 101, 101, 0.2);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .user-section {
    gap: 0.5rem;
  }
}
</style>