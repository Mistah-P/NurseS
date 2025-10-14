import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/init';
import sessionService from './sessionService';

class TeacherDataService {
  constructor() {
    this.teacherData = null;
    this.isLoading = false;
    this.isInitialized = false;
    this.listeners = [];
    this.currentUser = null;
    
    // Initialize auth state listener
    this.initializeAuthListener();
  }

  initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user && user.uid !== this.currentUser?.uid) {
        // New user logged in, clear cache and reload data
        this.currentUser = user;
        this.teacherData = null;
        this.isInitialized = false;
        await this.loadTeacherData();
      } else if (!user) {
        // User logged out, clear cache
        this.currentUser = null;
        this.teacherData = null;
        this.isInitialized = false;
      }
      
      // Notify all listeners
      this.notifyListeners();
    });
  }

  async loadTeacherData() {
    if (this.isLoading || !this.currentUser) {
      return this.teacherData;
    }

    this.isLoading = true;

    try {
      console.log('Loading teacher data for UID:', this.currentUser.uid);
      
      // Get teacher profile first (this is the primary source of teacher data)
      const teacherProfile = await sessionService.getTeacherProfile(this.currentUser.uid);
      console.log('Teacher profile found:', teacherProfile);
      
      // Get teacher session
      const teacherSession = await sessionService.getTeacherSession(this.currentUser.uid);
      console.log('Teacher session found:', teacherSession);
      
      if (teacherProfile) {
        // We have a valid teacher profile
        this.teacherData = {
          session: teacherSession,
          profile: teacherProfile,
          name: teacherProfile.name || 'Teacher',
          email: teacherProfile.email || this.currentUser.email,
          id: teacherProfile.id || this.currentUser.uid
        };
      } else if (teacherSession && teacherSession.teacherData) {
        // No profile but we have session data
        this.teacherData = {
          session: teacherSession,
          profile: null,
          name: teacherSession.teacherData.teacherName || 'Teacher',
          email: teacherSession.teacherData.teacherEmail || this.currentUser.email,
          id: this.currentUser.uid
        };
      } else {
        // No profile or session data, use Firebase user data
        console.warn('No teacher profile or session found, using Firebase user data');
        this.teacherData = {
          session: null,
          profile: null,
          name: this.currentUser.displayName || 'Teacher',
          email: this.currentUser.email || '',
          id: this.currentUser.uid
        };
      }

      console.log('Final teacher data:', this.teacherData);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading teacher data:', error);
      
      // Fallback to Firebase user data
      this.teacherData = {
        session: null,
        profile: null,
        name: this.currentUser?.displayName || 'Teacher',
        email: this.currentUser?.email || '',
        id: this.currentUser?.uid || ''
      };
      this.isInitialized = true;
      
      // Retry once after a short delay
      setTimeout(() => {
        this.retryLoadTeacherData();
      }, 2000);
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }

    return this.teacherData;
  }

  async retryLoadTeacherData() {
    if (!this.currentUser || this.isLoading) return;
    
    console.log('Retrying teacher data load for UID:', this.currentUser.uid);
    
    try {
      const teacherProfile = await sessionService.getTeacherProfile(this.currentUser.uid);
      
      if (teacherProfile && teacherProfile.name) {
        console.log('Retry successful, teacher profile found:', teacherProfile);
        this.teacherData = {
          ...this.teacherData,
          profile: teacherProfile,
          name: teacherProfile.name,
          email: teacherProfile.email || this.currentUser.email
        };
        this.notifyListeners();
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }

  async getTeacherData() {
    if (!this.isInitialized && !this.isLoading) {
      await this.loadTeacherData();
    }
    return this.teacherData;
  }

  getTeacherDataSync() {
    return this.teacherData;
  }

  isDataLoaded() {
    return this.isInitialized;
  }

  isDataLoading() {
    return this.isLoading;
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.teacherData, this.isLoading, this.isInitialized);
      } catch (error) {
        console.error('Error in teacher data listener:', error);
      }
    });
  }

  // Force refresh data
  async refreshData() {
    this.teacherData = null;
    this.isInitialized = false;
    return await this.loadTeacherData();
  }

  // Clear cache (for logout)
  clearCache() {
    this.teacherData = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.currentUser = null;
  }
}

// Create singleton instance
const teacherDataService = new TeacherDataService();

export default teacherDataService;