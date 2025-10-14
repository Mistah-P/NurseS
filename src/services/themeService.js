import sessionService from './sessionService'
import { auth } from '../firebase/init'
import { onAuthStateChanged } from 'firebase/auth'

class ThemeService {
  constructor() {
    this.currentTheme = 'dark' // Default theme
    this.currentUser = null
    this.userType = null
    this.authUnsubscribe = null
    
    // Initialize theme system
    this.init()
  }

  init() {
    // Set up authentication listener to load user theme preferences
    this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user
        await this.loadUserTheme()
      } else {
        this.currentUser = null
        this.userType = null
        this.setTheme('dark') // Reset to default when logged out
      }
    })

    // Apply initial theme
    this.applyTheme(this.currentTheme)
  }

  // Determine user type based on route or stored session data
  async determineUserType() {
    try {
      if (!this.currentUser) return null

      // Try to get user type from existing session
      const studentSession = await sessionService.getStudentSession()
      if (studentSession) {
        return 'student'
      }

      const teacherSession = await sessionService.getTeacherSession()
      if (teacherSession) {
        return 'teacher'
      }

      // Fallback: check current route
      const currentPath = window.location.pathname
      if (currentPath.includes('/teacher') || currentPath.includes('/dashboard')) {
        return 'teacher'
      } else {
        return 'student'
      }
    } catch (error) {
      console.error('Error determining user type:', error)
      return 'student' // Default fallback
    }
  }

  // Load user's theme preference from database
  async loadUserTheme() {
    try {
      if (!this.currentUser) return

      this.userType = await this.determineUserType()
      let preferences = {}

      if (this.userType === 'teacher') {
        preferences = await sessionService.getTeacherPreferences(this.currentUser.uid)
      } else {
        preferences = await sessionService.getUserPreferences(this.currentUser.uid)
      }

      const savedTheme = preferences.theme || 'dark'
      this.setTheme(savedTheme)
    } catch (error) {
      console.error('Error loading user theme:', error)
      this.setTheme('dark') // Fallback to dark theme
    }
  }

  // Save user's theme preference to database
  async saveUserTheme(theme) {
    try {
      if (!this.currentUser || !this.userType) return

      if (this.userType === 'teacher') {
        const currentPrefs = await sessionService.getTeacherPreferences(this.currentUser.uid)
        await sessionService.saveTeacherPreferences(this.currentUser.uid, {
          ...currentPrefs,
          theme
        })
      } else {
        const currentPrefs = await sessionService.getUserPreferences(this.currentUser.uid)
        await sessionService.saveUserPreferences(this.currentUser.uid, {
          ...currentPrefs,
          theme
        })
      }
    } catch (error) {
      console.error('Error saving user theme:', error)
    }
  }

  // Set theme and apply it
  async setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme, 'Defaulting to dark')
      theme = 'dark'
    }

    this.currentTheme = theme
    this.applyTheme(theme)

    // Save to database if user is logged in
    if (this.currentUser) {
      await this.saveUserTheme(theme)
    }
  }

  // Apply theme by setting CSS custom properties
  applyTheme(theme) {
    const root = document.documentElement
    
    if (theme === 'light') {
      // Light theme variables
      root.style.setProperty('--bg-primary', '#ffffff')
      root.style.setProperty('--bg-secondary', '#f8fafc')
      root.style.setProperty('--bg-tertiary', '#e2e8f0')
      root.style.setProperty('--bg-card', '#ffffff')
      root.style.setProperty('--bg-header', 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)')
      root.style.setProperty('--bg-sidebar', '#f1f5f9')
      root.style.setProperty('--bg-input', '#ffffff')
      root.style.setProperty('--bg-button', 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)')
      root.style.setProperty('--bg-button-hover', 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)')
      
      root.style.setProperty('--text-primary', '#1e293b')
      root.style.setProperty('--text-secondary', '#475569')
      root.style.setProperty('--text-tertiary', '#64748b')
      root.style.setProperty('--text-inverse', '#ffffff')
      root.style.setProperty('--text-on-accent', '#ffffff')
      
      root.style.setProperty('--border-primary', '#e2e8f0')
      root.style.setProperty('--border-secondary', '#cbd5e1')
      root.style.setProperty('--border-focus', '#3b82f6')
      
      root.style.setProperty('--accent-primary', '#3b82f6')
      root.style.setProperty('--accent-success', '#10b981')
      root.style.setProperty('--accent-warning', '#f59e0b')
      root.style.setProperty('--accent-error', '#ef4444')
      root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)')
      root.style.setProperty('--accent-gradient-alpha', 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%)')
      
      // Additional color variables for consistency
      root.style.setProperty('--success-color', '#10b981')
      root.style.setProperty('--success-color-alpha', 'rgba(16, 185, 129, 0.1)')
      root.style.setProperty('--warning-color', '#f59e0b')
      root.style.setProperty('--warning-color-alpha', 'rgba(245, 158, 11, 0.1)')
      root.style.setProperty('--error-color', '#ef4444')
      root.style.setProperty('--error-color-alpha', 'rgba(239, 68, 68, 0.1)')
      root.style.setProperty('--error-color-dark', '#dc2626')
      
      root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)')
      root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1)')
      root.style.setProperty('--shadow-light', '0 4px 12px rgba(0, 0, 0, 0.1)')
      root.style.setProperty('--shadow-dark', 'rgba(0, 0, 0, 0.2)')
      root.style.setProperty('--shadow-accent', '0 8px 25px rgba(59, 130, 246, 0.3)')
      root.style.setProperty('--shadow-accent-hover', '0 12px 35px rgba(59, 130, 246, 0.4)')
      root.style.setProperty('--shadow-accent-light', '0 4px 15px rgba(59, 130, 246, 0.2)')
      root.style.setProperty('--shadow-danger', '0 4px 15px rgba(239, 68, 68, 0.3)')
      root.style.setProperty('--shadow-modal', '0 25px 50px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--modal-overlay', 'rgba(0, 0, 0, 0.6)')
    } else {
      // Dark theme variables (current theme)
      root.style.setProperty('--bg-primary', '#1a202c')
      root.style.setProperty('--bg-secondary', '#2d3748')
      root.style.setProperty('--bg-tertiary', '#4a5568')
      root.style.setProperty('--bg-card', '#2d3748')
      root.style.setProperty('--bg-header', 'linear-gradient(135deg, #252939 0%, #48454b 100%)')
      root.style.setProperty('--bg-sidebar', '#1a1d29')
      root.style.setProperty('--bg-input', '#1a202c')
      root.style.setProperty('--bg-button', 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)')
      root.style.setProperty('--bg-button-hover', 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)')
      
      root.style.setProperty('--text-primary', '#ffffff')
      root.style.setProperty('--text-secondary', '#e2e8f0')
      root.style.setProperty('--text-tertiary', '#a0aec0')
      root.style.setProperty('--text-inverse', '#1a202c')
      root.style.setProperty('--text-on-accent', '#ffffff')
      
      root.style.setProperty('--border-primary', '#4a5568')
      root.style.setProperty('--border-secondary', '#2d3748')
      root.style.setProperty('--border-focus', '#48bb78')
      
      root.style.setProperty('--accent-primary', '#48bb78')
      root.style.setProperty('--accent-success', '#48bb78')
      root.style.setProperty('--accent-warning', '#ed8936')
      root.style.setProperty('--accent-error', '#f56565')
      root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      root.style.setProperty('--accent-gradient-alpha', 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)')
      
      // Additional color variables for consistency
      root.style.setProperty('--success-color', '#48bb78')
      root.style.setProperty('--success-color-alpha', 'rgba(72, 187, 120, 0.1)')
      root.style.setProperty('--warning-color', '#ed8936')
      root.style.setProperty('--warning-color-alpha', 'rgba(237, 137, 54, 0.1)')
      root.style.setProperty('--error-color', '#f56565')
      root.style.setProperty('--error-color-alpha', 'rgba(245, 101, 101, 0.1)')
      root.style.setProperty('--error-color-dark', '#e53e3e')
      
      root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.4)')
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.5)')
      root.style.setProperty('--shadow-light', '0 4px 12px rgba(0, 0, 0, 0.4)')
      root.style.setProperty('--shadow-dark', 'rgba(0, 0, 0, 0.6)')
      root.style.setProperty('--shadow-accent', '0 8px 25px rgba(102, 126, 234, 0.3)')
      root.style.setProperty('--shadow-accent-hover', '0 12px 35px rgba(102, 126, 234, 0.4)')
      root.style.setProperty('--shadow-accent-light', '0 4px 15px rgba(102, 126, 234, 0.2)')
      root.style.setProperty('--shadow-danger', '0 4px 15px rgba(245, 101, 101, 0.3)')
      root.style.setProperty('--shadow-modal', '0 25px 50px rgba(0, 0, 0, 0.7)')
      root.style.setProperty('--modal-overlay', 'rgba(0, 0, 0, 0.8)')
    }

    // Set theme attribute on body for additional styling hooks
    document.body.setAttribute('data-theme', theme)
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme
  }

  // Toggle between light and dark themes
  async toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    await this.setTheme(newTheme)
    return newTheme
  }

  // Cleanup method
  destroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
    }
  }
}

// Export singleton instance
export default new ThemeService()