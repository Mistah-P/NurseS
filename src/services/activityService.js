import { db } from '../firebase/init'
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore'

class ActivityService {
  constructor() {
    // Cache for teacher activities with 5-minute expiration
    this.cache = {
      teacherActivities: new Map(),
      lastUpdated: new Map(),
      cacheExpiration: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
  }

  // Check if cache is valid for a specific teacher
  isCacheValid(teacherId) {
    const lastUpdated = this.cache.lastUpdated.get(teacherId)
    if (!lastUpdated) return false
    
    const now = Date.now()
    return (now - lastUpdated) < this.cache.cacheExpiration
  }

  // Get cached activities for a teacher
  getCachedActivities(teacherId) {
    if (this.isCacheValid(teacherId)) {
      return this.cache.teacherActivities.get(teacherId)
    }
    return null
  }

  // Cache activities for a teacher
  cacheActivities(teacherId, activities) {
    this.cache.teacherActivities.set(teacherId, activities)
    this.cache.lastUpdated.set(teacherId, Date.now())
  }

  // Transform room data to activity format
  transformRoomToActivity(doc) {
    const data = doc.data()
    
    return {
      id: doc.id,
      name: data.activityName || 'Unnamed Activity',
      section: data.section || 'Unknown Section',
      date: data.createdAt?.toDate() || new Date(),
      participants: data.studentsJoined?.length || 0,
      gameMode: data.mode || 'Unknown',
      difficulty: data.difficultyLevel || 'Medium',
      status: data.status || 'unknown',
      roomCode: data.roomCode,
      rawData: data
    }
  }

  // Fetch completed activities for a specific teacher with caching
  async getTeacherActivities(teacherId) {
    try {
      // Check cache first
      const cachedActivities = this.getCachedActivities(teacherId)
      if (cachedActivities) {
        console.log('📋 Using cached activities for teacher:', teacherId)
        return cachedActivities
      }

      console.log('📋 Fetching fresh activities for teacher:', teacherId)
      
      const roomsRef = collection(db, 'rooms')
      const q = query(roomsRef, where('teacherId', '==', teacherId))
      
      const querySnapshot = await getDocs(q)
      
      const activities = []
      
      querySnapshot.forEach((doc) => {
        const activity = this.transformRoomToActivity(doc)
        activities.push(activity)
      })
      
      // Sort by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // Cache the results
      this.cacheActivities(teacherId, activities)
      
      console.log(`📋 Loaded and cached ${activities.length} activities for teacher:`, teacherId)
      
      return activities
    } catch (error) {
      console.error('❌ Error in getTeacherActivities:', error)
      throw error
    }
  }

  // Clear cache for a specific teacher (useful for real-time updates)
  clearTeacherCache(teacherId) {
    this.cache.teacherActivities.delete(teacherId)
    this.cache.lastUpdated.delete(teacherId)
    console.log('🗑️ Cleared cache for teacher:', teacherId)
  }

  // Clear all cache
  clearAllCache() {
    this.cache.teacherActivities.clear()
    this.cache.lastUpdated.clear()
    console.log('🗑️ Cleared all activity cache')
  }
  
  // Check if leaderboard cache is valid
  isLeaderboardCacheValid(roomCode) {
    const lastUpdated = this.cache.lastUpdated.get(`leaderboard_${roomCode}`)
    if (!lastUpdated) return false
    
    const now = Date.now()
    // Use shorter cache for leaderboards (2 minutes) as they might change more frequently
    return (now - lastUpdated) < (2 * 60 * 1000)
  }

  // Get cached leaderboard
  getCachedLeaderboard(roomCode) {
    if (this.isLeaderboardCacheValid(roomCode)) {
      return this.cache.teacherActivities.get(`leaderboard_${roomCode}`)
    }
    return null
  }

  // Cache leaderboard
  cacheLeaderboard(roomCode, leaderboard) {
    this.cache.teacherActivities.set(`leaderboard_${roomCode}`, leaderboard)
    this.cache.lastUpdated.set(`leaderboard_${roomCode}`, Date.now())
  }

  // Fetch leaderboard data for a specific activity/room with caching
  async getActivityLeaderboard(roomCode) {
    try {
      // Check cache first
      const cachedLeaderboard = this.getCachedLeaderboard(roomCode)
      if (cachedLeaderboard) {
        console.log('🏆 Using cached leaderboard for room:', roomCode)
        return cachedLeaderboard
      }

      console.log('🏆 Fetching fresh leaderboard for room:', roomCode)

      // First get the room data
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('roomCode', '==', roomCode)
      )
      
      const roomSnapshot = await getDocs(roomsQuery)
      
      if (roomSnapshot.empty) {
        throw new Error('Room not found')
      }
      
      const roomData = roomSnapshot.docs[0].data()
      
      // Try to get live session data for leaderboard
      const liveSessionsQuery = query(
        collection(db, 'liveSessions'),
        where('roomCode', '==', roomCode)
      )
      
      const liveSessionSnapshot = await getDocs(liveSessionsQuery)
      
      let leaderboard = []
      
      if (!liveSessionSnapshot.empty) {
        const liveSessionData = liveSessionSnapshot.docs[0].data()
        
        // Transform leaderboard data to match the expected format
        if (liveSessionData.studentProgress) {
          Object.values(liveSessionData.studentProgress).forEach(student => {
            leaderboard.push({
              id: student.studentId,
              name: student.studentName,
              wpm: student.wpm || 0,
              accuracy: student.accuracy || 0,
              status: student.status || 'ready'
            })
          })
        }
        
        // Sort by WPM descending
        leaderboard.sort((a, b) => b.wpm - a.wpm)
      } else {
        // If no live session data, return students who joined the room
        if (roomData.studentsJoined) {
          roomData.studentsJoined.forEach(student => {
            leaderboard.push({
              id: student.studentId,
              name: student.studentName,
              wpm: 0,
              accuracy: 0,
              status: 'completed'
            })
          })
        }
      }
      
      // Cache the results
      this.cacheLeaderboard(roomCode, leaderboard)
      
      console.log(`🏆 Loaded and cached leaderboard with ${leaderboard.length} students for room:`, roomCode)
      
      return leaderboard
      
    } catch (error) {
      console.error('Error fetching activity leaderboard:', error)
      throw new Error('Failed to fetch leaderboard data')
    }
  }

  // Clear leaderboard cache for a specific room
  clearLeaderboardCache(roomCode) {
    this.cache.teacherActivities.delete(`leaderboard_${roomCode}`)
    this.cache.lastUpdated.delete(`leaderboard_${roomCode}`)
    console.log('🗑️ Cleared leaderboard cache for room:', roomCode)
  }
}

// Create singleton instance
const activityService = new ActivityService()

export default activityService