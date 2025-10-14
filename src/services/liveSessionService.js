import { db } from '../firebase/init';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import api from './api';

class LiveSessionService {
  constructor() {
    this.listeners = new Map();
    this.currentRoomCode = null;
  }

  /**
   * Start a live typing activity
   * @param {string} roomCode - The room code
   * @param {Object} activityData - Activity configuration
   * @returns {Promise<Object>} API response
   */
  async startActivity(roomCode, activityData) {
    try {
      const response = await api.liveSessionAPI.startActivity(roomCode, activityData);
      
      if (response.data.success) {
        this.currentRoomCode = roomCode.toUpperCase();
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error starting live activity:', error);
      throw new Error(error.response?.data?.message || 'Failed to start live activity');
    }
  }

  /**
   * End a live typing activity
   * @param {string} roomCode - The room code
   * @returns {Promise<Object>} API response
   */
  async endActivity(roomCode) {
    try {
      const response = await api.liveSessionAPI.endActivity(roomCode);
      
      if (response.data.success) {
        // Clean up listeners
        this.unsubscribeFromLiveSession(roomCode);
        this.currentRoomCode = null;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error ending live activity:', error);
      throw new Error(error.response?.data?.message || 'Failed to end live activity');
    }
  }

  /**
   * Subscribe to live session updates (for teachers)
   * @param {string} roomCode - The room code
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToLiveSession(roomCode, callback) {
    const upperRoomCode = roomCode.toUpperCase();
    
    // Clean up existing listener for this room
    this.unsubscribeFromLiveSession(upperRoomCode);
    
    const liveSessionRef = doc(db, 'liveSessions', upperRoomCode);
    
    const unsubscribe = onSnapshot(
      liveSessionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Convert Firestore timestamps to JavaScript dates
          const processedData = this.processTimestamps(data);
          
          callback({
            exists: true,
            data: processedData
          });
        } else {
          callback({
            exists: false,
            data: null
          });
        }
      },
      (error) => {
        console.error('❌ Error in live session listener:', error);
        callback({
          exists: false,
          data: null,
          error: error.message
        });
      }
    );
    
    // Store the unsubscribe function
    this.listeners.set(`liveSession_${upperRoomCode}`, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Subscribe to leaderboard updates
   * @param {string} roomCode - The room code
   * @param {Function} callback - Callback function to handle leaderboard updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToLeaderboard(roomCode, callback) {
    const upperRoomCode = roomCode.toUpperCase();
    
    const liveSessionRef = doc(db, 'liveSessions', upperRoomCode);
    
    const unsubscribe = onSnapshot(
      liveSessionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Extract leaderboard data
          const leaderboard = data.leaderboard || [];
          
          callback(leaderboard);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error('❌ Error in leaderboard listener:', error);
        callback([]);
      }
    );
    
    // Store the unsubscribe function
    this.listeners.set(`leaderboard_${upperRoomCode}`, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Unsubscribe from leaderboard updates
   * @param {string} roomCode - The room code
   */
  unsubscribeFromLeaderboard(roomCode) {
    const upperRoomCode = roomCode.toUpperCase();
    const listenerKey = `leaderboard_${upperRoomCode}`;
    
    if (this.listeners.has(listenerKey)) {
      const unsubscribe = this.listeners.get(listenerKey);
      unsubscribe();
      this.listeners.delete(listenerKey);
    }
  }

  /**
   * Subscribe to room updates (for students)
   * @param {string} roomCode - The room code
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToRoomUpdates(roomCode, callback) {
    const upperRoomCode = roomCode.toUpperCase();
    
    // Clean up existing listener for this room
    this.unsubscribeFromRoomUpdates(upperRoomCode);
    
    // Query for room by roomCode
    const roomsRef = collection(db, 'rooms');
    const roomQuery = query(roomsRef, where('roomCode', '==', upperRoomCode));
    
    const unsubscribe = onSnapshot(
      roomQuery,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const roomDoc = querySnapshot.docs[0];
          const data = roomDoc.data();
          
          // Convert Firestore timestamps to JavaScript dates
          const processedData = this.processTimestamps(data);
          
          callback({
            exists: true,
            data: processedData
          });
        } else {
          callback({
            exists: false,
            data: null
          });
        }
      },
      (error) => {
        console.error('❌ Error in room listener:', error);
        callback({
          exists: false,
          data: null,
          error: error.message
        });
      }
    );
    
    // Store the unsubscribe function
    this.listeners.set(`room_${upperRoomCode}`, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Update student progress in real-time
   * @param {string} roomCode - The room code
   * @param {Object} progressData - Student progress data
   * @returns {Promise<Object>} API response
   */
  async updateStudentProgress(roomCode, studentId, progressData) {
    try {
      const response = await api.liveSessionAPI.updateStudentProgress(roomCode, studentId, progressData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating student progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to update student progress');
    }
  }

  /**
   * Get current leaderboard
   * @param {string} roomCode - The room code
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard(roomCode) {
    try {
      const response = await api.liveSessionAPI.getLeaderboard(roomCode);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }

  /**
   * Get live session data
   * @param {string} roomCode - The room code
   * @returns {Promise<Object>} Live session data
   */
  async getLiveSession(roomCode) {
    try {
      const response = await api.liveSessionAPI.getLiveSession(roomCode);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching live session:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch live session');
    }
  }

  /**
   * Unsubscribe from live session updates
   * @param {string} roomCode - The room code
   */
  unsubscribeFromLiveSession(roomCode) {
    const upperRoomCode = roomCode.toUpperCase();
    const listenerKey = `liveSession_${upperRoomCode}`;
    
    if (this.listeners.has(listenerKey)) {
      const unsubscribe = this.listeners.get(listenerKey);
      unsubscribe();
      this.listeners.delete(listenerKey);
    }
  }

  /**
   * Unsubscribe from room updates
   * @param {string} roomCode - The room code
   */
  unsubscribeFromRoomUpdates(roomCode) {
    const upperRoomCode = roomCode.toUpperCase();
    const listenerKey = `room_${upperRoomCode}`;
    
    if (this.listeners.has(listenerKey)) {
      const unsubscribe = this.listeners.get(listenerKey);
      unsubscribe();
      this.listeners.delete(listenerKey);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    
    this.listeners.clear();
    this.currentRoomCode = null;
  }

  /**
   * Process Firestore timestamps to JavaScript dates
   * @param {Object} data - Raw Firestore data
   * @returns {Object} Processed data with converted timestamps
   */
  processTimestamps(data) {
    const processed = { ...data };
    
    // Convert common timestamp fields
    const timestampFields = [
      'startedAt', 'countdownStartedAt', 'createdAt', 'updatedAt'
    ];
    
    timestampFields.forEach(field => {
      if (processed[field]) {
        if (processed[field].toDate && typeof processed[field].toDate === 'function') {
          // It's a Firestore Timestamp
          processed[field] = processed[field].toDate();
        } else if (processed[field].seconds && processed[field].nanoseconds) {
          // It's a Firestore Timestamp object structure
          processed[field] = new Date(processed[field].seconds * 1000 + processed[field].nanoseconds / 1000000);
        }
        // If it's already a Date or timestamp number, leave it as is
      }
    });
    
    // Process student progress timestamps
    if (processed.studentProgress) {
      Object.keys(processed.studentProgress).forEach(studentId => {
        const student = processed.studentProgress[studentId];
        
        // Handle lastUpdate timestamp
        if (student.lastUpdate) {
          if (student.lastUpdate.toDate && typeof student.lastUpdate.toDate === 'function') {
            student.lastUpdate = student.lastUpdate.toDate();
          } else if (student.lastUpdate.seconds && student.lastUpdate.nanoseconds) {
            student.lastUpdate = new Date(student.lastUpdate.seconds * 1000 + student.lastUpdate.nanoseconds / 1000000);
          }
        }
        
        // Handle startedTypingAt timestamp
        if (student.startedTypingAt) {
          if (student.startedTypingAt.toDate && typeof student.startedTypingAt.toDate === 'function') {
            student.startedTypingAt = student.startedTypingAt.toDate();
          } else if (student.startedTypingAt.seconds && student.startedTypingAt.nanoseconds) {
            student.startedTypingAt = new Date(student.startedTypingAt.seconds * 1000 + student.startedTypingAt.nanoseconds / 1000000);
          }
        }
        
        // Handle completedAt timestamp
        if (student.completedAt) {
          if (student.completedAt.toDate && typeof student.completedAt.toDate === 'function') {
            student.completedAt = student.completedAt.toDate();
          } else if (student.completedAt.seconds && student.completedAt.nanoseconds) {
            student.completedAt = new Date(student.completedAt.seconds * 1000 + student.completedAt.nanoseconds / 1000000);
          }
        }
      });
    }
    
    return processed;
  }

  /**
   * Calculate countdown remaining time
   * @param {Date} countdownStartedAt - When countdown started
   * @param {number} countdownDuration - Countdown duration in seconds
   * @returns {number} Remaining seconds (0 if expired)
   */
  getCountdownRemaining(countdownStartedAt, countdownDuration) {
    if (!countdownStartedAt || !countdownDuration) return 0;
    
    const now = new Date();
    const elapsed = Math.floor((now - countdownStartedAt) / 1000);
    const remaining = Math.max(0, countdownDuration - elapsed);
    
    return remaining;
  }

  /**
   * Check if countdown is active
   * @param {Object} liveSessionData - Live session data
   * @returns {boolean} True if countdown is active
   */
  isCountdownActive(liveSessionData) {
    if (!liveSessionData || liveSessionData.status !== 'countdown') return false;
    
    const remaining = this.getCountdownRemaining(
      liveSessionData.countdownStartedAt,
      liveSessionData.countdownDuration
    );
    
    return remaining > 0;
  }
}

// Export singleton instance
export default new LiveSessionService();