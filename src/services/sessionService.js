import { db } from '../firebase/init'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

class SessionService {
  constructor() {
    this.currentSession = null
    this.sessionListeners = new Map()
  }

  // Generate unique session ID
  generateSessionId() {
    return uuidv4()
  }

  // Get device info for security tracking
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    }
  }

  // Create a new session in Firestore
  async createSession(userId, userType, additionalData = {}) {
    try {
      const sessionId = this.generateSessionId()
      
      // No expiration for any user type - all users can login anytime
      let expiresAt = null

      const sessionData = {
        userId,
        userType,
        isActive: true,
        loginTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
        expiresAt,
        deviceInfo: this.getDeviceInfo(),
        ...additionalData
      }

      await setDoc(doc(db, 'sessions', sessionId), sessionData)
      
      // Update user's current session - only if user document exists
      try {
        const userDocRef = doc(db, 'users', userId)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            'currentSession.isActive': true,
            'currentSession.loginTime': serverTimestamp(),
            'currentSession.lastActivity': serverTimestamp()
          })
        } else {
          // For teachers and other users without user documents, create a minimal user record
          await setDoc(userDocRef, {
            userId,
            userType,
            currentSession: {
              isActive: true,
              loginTime: serverTimestamp(),
              lastActivity: serverTimestamp()
            },
            createdAt: serverTimestamp()
          })
        }
      } catch (userUpdateError) {
        console.warn('Could not update user document, but session created successfully:', userUpdateError)
        // Continue execution - session is still valid even if user document update fails
      }

      this.currentSession = { sessionId, ...sessionData }
      return { sessionId, ...sessionData }
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  // Get session from Firestore
  async getSession(sessionId) {
    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId))
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data()
        
        // No expiration checks - all sessions are permanent
        // (All user types can login anytime)
        
        return { sessionId, ...sessionData }
      }
      return null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Get session by userId from Firestore
  async getSessionByUserId(userId) {
    try {
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(sessionsQuery)
      
      if (!querySnapshot.empty) {
        // Get the first active session (there should only be one)
        const sessionDoc = querySnapshot.docs[0]
        const sessionData = sessionDoc.data()
        const sessionId = sessionDoc.id
        
        // No expiration checks - all sessions are permanent
        // (All user types can login anytime)
        
        return { sessionId, ...sessionData }
      }
      
      return null
    } catch (error) {
      console.error('Error getting session by userId:', error)
      return null
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId) {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        lastActivity: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }

  // Destroy session
  async destroySession(sessionId) {
    try {
      const session = await this.getSession(sessionId)
      if (session) {
        // Update user's current session status - only if user document exists
        try {
          const userDocRef = doc(db, 'users', session.userId)
          const userDoc = await getDoc(userDocRef)
          
          if (userDoc.exists()) {
            await updateDoc(userDocRef, {
              'currentSession.isActive': false
            })
          }
        } catch (userUpdateError) {
          console.warn('Could not update user document during session destruction:', userUpdateError)
          // Continue execution - session cleanup should still proceed
        }
        
        // Delete session document
        await deleteDoc(doc(db, 'sessions', sessionId))
      }
      
      this.currentSession = null
    } catch (error) {
      console.error('Error destroying session:', error)
    }
  }

  // Admin session methods
  async createAdminSession(adminId, email) {
    return await this.createSession(adminId, 'admin', {
      adminData: {
        adminId,
        email,
        permissions: ['read', 'write', 'delete', 'manage_teachers']
      }
    })
  }

  async getAdminSession() {
    try {
      // First check if we have a current session in memory
      if (this.currentSession && this.currentSession.userType === 'admin') {
        return this.currentSession
      }
      
      // If not in memory, query Firestore for admin session
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userType', '==', 'admin'),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(sessionsQuery)
      
      if (!querySnapshot.empty) {
        // Get the first active admin session (there should only be one)
        const sessionDoc = querySnapshot.docs[0]
        const sessionData = sessionDoc.data()
        const sessionId = sessionDoc.id
        
        const adminSession = { sessionId, ...sessionData }
        
        // Store in memory for future use
        this.currentSession = adminSession
        
        return adminSession
      }
      
      return null
    } catch (error) {
      console.error('Error getting admin session:', error)
      return null
    }
  }

  async destroyAdminSession() {
    try {
      // Clear current session from memory immediately for faster UI response
      this.currentSession = null
      
      // Find and destroy admin session in Firestore (run in background)
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userType', '==', 'admin'),
        where('isActive', '==', true)
      )
      
      const querySnapshot = await getDocs(sessionsQuery)
      
      if (!querySnapshot.empty) {
        // Destroy all active admin sessions in parallel
        const deletePromises = querySnapshot.docs.map(doc => 
          this.destroySession(doc.id)
        )
        await Promise.all(deletePromises)
      }
      
      return true
    } catch (error) {
      console.error('Error destroying admin session:', error)
      // Don't throw error to prevent logout from failing
      return false
    }
  }

  // Teacher session methods
  async createTeacherSession(firebaseUid, email) {
    return await this.createSession(firebaseUid, 'teacher', {
      teacherData: {
        teacherEmail: email,
        institution: '',
        department: ''
      }
    })
  }

  // Get teacher profile data from teachers collection
  async getTeacherProfile(firebaseUid) {
    try {
      console.log('Getting teacher profile for Firebase UID:', firebaseUid);
      
      // First try to find teacher by document ID (Firebase UID)
      let teacherRef = doc(db, 'teachers', firebaseUid)
      let teacherDoc = await getDoc(teacherRef)
      console.log('Teacher doc by ID exists:', teacherDoc.exists());

      // If not found by document ID, try to find by firebaseUid field (for backward compatibility)
      if (!teacherDoc.exists()) {
        console.log('Searching by firebaseUid field...');
        const teachersQuery = query(collection(db, 'teachers'), where('firebaseUid', '==', firebaseUid))
        const teachersSnapshot = await getDocs(teachersQuery)
        console.log('Teachers found by firebaseUid field:', teachersSnapshot.size);
        
        if (!teachersSnapshot.empty) {
          teacherDoc = teachersSnapshot.docs[0]
        }
      }

      // If still not found, try to find by email (additional fallback)
      if (!teacherDoc.exists()) {
        console.log('Searching by email field...');
        // Get the current user's email from Firebase Auth
        const { auth } = await import('../firebase/init');
        const currentUser = auth.currentUser;
        
        if (currentUser && currentUser.email) {
          const teachersQuery = query(collection(db, 'teachers'), where('email', '==', currentUser.email))
          const teachersSnapshot = await getDocs(teachersQuery)
          console.log('Teachers found by email:', teachersSnapshot.size);
          
          if (!teachersSnapshot.empty) {
            teacherDoc = teachersSnapshot.docs[0]
          }
        }
      }

      if (teacherDoc.exists()) {
        const data = teacherDoc.data()
        console.log('Teacher profile data found:', data);
        
        return {
          id: data.id || teacherDoc.id,
          name: data.name || data.fullName || 'Teacher',
          email: data.email,
          institution: data.institution,
          department: data.department,
          isActive: data.isActive !== false // Default to true if not specified
        }
      }
      
      console.warn('No teacher profile found for Firebase UID:', firebaseUid);
      return null
    } catch (error) {
      console.error('Error getting teacher profile:', error)
      return null
    }
  }

  async getTeacherSession(firebaseUid = null) {
    // If firebaseUid is provided, query Firestore directly (like students do)
    if (firebaseUid) {
      const session = await this.getSessionByUserId(firebaseUid)
      if (session && session.userType === 'teacher') {
        return session
      }
      return null
    }
    
    // Fallback to memory-based session (existing behavior)
    if (!this.currentSession || this.currentSession.userType !== 'teacher') {
      return null
    }
    return this.currentSession
  }

  async destroyTeacherSession() {
    if (this.currentSession && this.currentSession.userType === 'teacher') {
      await this.destroySession(this.currentSession.sessionId)
    }
  }

  // Student session methods
  async createStudentSession(studentDataOrId) {
    // Handle both scenarios: simple userId string (login) or studentData object (room joining)
    if (typeof studentDataOrId === 'string') {
      // Login scenario: simple userId
      return await this.createSession(studentDataOrId, 'student', {
        studentData: {
          studentId: studentDataOrId,
          studentName: null,
          roomCode: null
        }
      })
    } else {
      // Room joining scenario: full studentData object
      return await this.createSession(studentDataOrId.studentId, 'student', {
        studentData: {
          studentId: studentDataOrId.studentId,
          studentName: studentDataOrId.studentName,
          roomCode: studentDataOrId.roomCode
        }
      })
    }
  }

  async getStudentSession(studentId = null) {
    // If studentId is provided, query Firestore directly
    if (studentId) {
      const session = await this.getSessionByUserId(studentId)
      if (session && session.userType === 'student') {
        return session
      }
      return null
    }
    
    // If no studentId provided, use current session from memory
    if (!this.currentSession || this.currentSession.userType !== 'student') {
      return null
    }
    return this.currentSession
  }

  async destroyStudentSession() {
    if (this.currentSession && this.currentSession.userType === 'student') {
      await this.destroySession(this.currentSession.sessionId)
    }
  }

  async updateStudentRoomData(sessionId, roomData) {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        'studentData.currentRoom': roomData,
        lastActivity: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating student room data:', error)
    }
  }

  async removeStudentFromRoom(sessionId) {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        'studentData.currentRoom': null,
        lastActivity: serverTimestamp()
      })
    } catch (error) {
      console.error('Error removing student from room:', error)
    }
  }

  // Preferences methods
  async saveUserPreferences(userId, preferences) {
    try {
      const userDocRef = doc(db, 'users', userId)
      
      // Use setDoc with merge option to handle both create and update cases
      // This avoids race conditions and simplifies the logic
      await setDoc(userDocRef, {
        userId,
        preferences,
        updatedAt: serverTimestamp(),
        // Only set createdAt if document doesn't exist
        ...(!(await getDoc(userDocRef)).exists() && { createdAt: serverTimestamp() })
      }, { merge: true })
      
    } catch (error) {
      // If there's still an error, try a simpler approach
      console.warn('Primary save method failed, trying fallback:', error.message)
      try {
        const userDocRef = doc(db, 'users', userId)
        await setDoc(userDocRef, {
          userId,
          preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true })
      } catch (fallbackError) {
        console.error('Error saving user preferences (fallback also failed):', fallbackError)
      }
    }
  }

  async getUserPreferences(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        return userDoc.data().preferences || {}
      }
      return {}
    } catch (error) {
      console.error('Error getting user preferences:', error)
      return {}
    }
  }

  // Teacher preferences methods
  async saveTeacherPreferences(teacherId, preferences) {
    try {
      await setDoc(doc(db, 'teacherPreferences', teacherId), {
        userId: teacherId,
        preferences,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (error) {
      console.error('Error saving teacher preferences:', error)
    }
  }

  async getTeacherPreferences(teacherId) {
    try {
      const prefDoc = await getDoc(doc(db, 'teacherPreferences', teacherId))
      if (prefDoc.exists()) {
        return prefDoc.data().preferences || {}
      }
      return {}
    } catch (error) {
      console.error('Error getting teacher preferences:', error)
      return {}
    }
  }

  async updateTeacherPreferences(teacherId, preferences) {
    try {
      await setDoc(doc(db, 'teacherPreferences', teacherId), {
        userId: teacherId,
        preferences,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating teacher preferences:', error)
    }
  }

  // Auth token methods
  async saveAuthToken(userId, token) {
    try {
      const tokenId = uuidv4()
      await setDoc(doc(db, 'authTokens', tokenId), {
        userId,
        token,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
        deviceInfo: this.getDeviceInfo()
      })
      return tokenId
    } catch (error) {
      console.error('Error saving auth token:', error)
    }
  }

  async getAuthToken(userId) {
    try {
      const q = query(
        collection(db, 'authTokens'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const tokenDoc = querySnapshot.docs[0]
        const tokenData = tokenDoc.data()
        
        // Check if token is expired
        if (tokenData.expiresAt && new Date() > tokenData.expiresAt.toDate()) {
          await deleteDoc(doc(db, 'authTokens', tokenDoc.id))
          return null
        }
        
        return tokenData.token
      }
      return null
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Real-time session monitoring
  subscribeToSession(sessionId, callback) {
    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
      if (doc.exists()) {
        callback({ sessionId, ...doc.data() })
      } else {
        callback(null)
      }
    })
    
    this.sessionListeners.set(sessionId, unsubscribe)
    return unsubscribe
  }

  unsubscribeFromSession(sessionId) {
    const unsubscribe = this.sessionListeners.get(sessionId)
    if (unsubscribe) {
      unsubscribe()
      this.sessionListeners.delete(sessionId)
    }
  }

  // Cleanup expired sessions (should be called periodically)
  // Note: Teacher sessions are excluded from cleanup as they have no expiration
  async cleanupExpiredSessions() {
    try {
      // No cleanup needed - all sessions are permanent
      // (All user types can login anytime)
      console.log('Session cleanup skipped - all sessions are permanent')
    } catch (error) {
      console.error('Error in cleanup function:', error)
    }
  }
}

// Export singleton instance
export default new SessionService()