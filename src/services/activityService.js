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
      
      // Fetch regular typing activities from rooms collection
      const roomsRef = collection(db, 'rooms')
      const q = query(roomsRef, where('teacherId', '==', teacherId))
      
      const querySnapshot = await getDocs(q)
      
      const activities = []
      
      querySnapshot.forEach((doc) => {
        const activity = this.transformRoomToActivity(doc)
        activities.push(activity)
      })
      
      // Fetch AI Patient activities from typingResults collection
      const aiPatientActivities = await this.getAIPatientActivities(teacherId)
      console.log(`📊 Regular activities: ${activities.length}, AI Patient activities: ${aiPatientActivities.length}`)
      activities.push(...aiPatientActivities)
      
      // Sort by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      console.log(`📋 Total activities for teacher ${teacherId}: ${activities.length}`)
      
      // Cache the results
      this.cacheActivities(teacherId, activities)
      
      console.log(`📋 Loaded and cached ${activities.length} activities for teacher:`, teacherId)
      
      return activities
    } catch (error) {
      console.error('❌ Error in getTeacherActivities:', error)
      throw error
    }
  }

  // Fetch AI Patient activities from typingResults collection
  async getAIPatientActivities(teacherId) {
    try {
      const typingResultsRef = collection(db, 'typingResults')
      const q = query(typingResultsRef, where('sessionType', '==', 'ai-patient'))
      
      const querySnapshot = await getDocs(q)
      
      // First, get all room IDs that belong to this teacher
      const roomsRef = collection(db, 'rooms')
      const teacherRoomsQuery = query(roomsRef, where('teacherId', '==', teacherId))
      const teacherRoomsSnapshot = await getDocs(teacherRoomsQuery)
      
      const teacherRoomIds = new Set()
      teacherRoomsSnapshot.forEach((doc) => {
        teacherRoomIds.add(doc.id)
      })
      
      // Group results by roomId to create activities (only for teacher's rooms)
      const roomGroups = new Map()
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        
        // Only include results that have AI Patient data and belong to this teacher
        if (data.aiPatientData && data.roomId && teacherRoomIds.has(data.roomId)) {
          if (!roomGroups.has(data.roomId)) {
            roomGroups.set(data.roomId, {
              roomId: data.roomId,
              results: [],
              firstResult: data
            })
          }
          roomGroups.get(data.roomId).results.push(data)
        }
      })
      
      // Transform grouped results into activities
      const aiPatientActivities = []
      
      for (const [roomId, group] of roomGroups) {
        const firstResult = group.firstResult
        const activity = {
          id: `ai-patient-${roomId}`,
          name: firstResult.aiPatientData?.patientName ? 
                `AI Patient: ${firstResult.aiPatientData.patientName}` : 
                'AI Patient Consultation',
          section: 'AI Patient', // We could enhance this by storing section in the result
          date: firstResult.timestamp?.toDate() || new Date(),
          participants: group.results.length,
          gameMode: 'AI Patient',
          difficulty: firstResult.content?.difficulty || 'Medium',
          status: 'completed',
          roomCode: roomId,
          isAIPatient: true,
          aiPatientData: {
            totalResults: group.results.length,
            averageScore: group.results.reduce((sum, r) => sum + (r.aiPatientData?.score || 0), 0) / group.results.length
          }
        }
        
        aiPatientActivities.push(activity)
      }
      
      console.log(`📋 Found ${aiPatientActivities.length} AI Patient activities for teacher ${teacherId}`)
      console.log('🔍 AI Patient activities:', aiPatientActivities)
      
      return aiPatientActivities
      
    } catch (error) {
      console.error('❌ Error fetching AI Patient activities:', error)
      return [] // Return empty array on error to not break the main flow
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

      // Check if this is an AI Patient activity by looking for AI Patient results first
      console.log('🔍 Checking for AI Patient activities in room:', roomCode)
      const aiPatientQuery = query(
        collection(db, 'typingResults'),
        where('roomId', '==', roomCode),
        where('sessionType', '==', 'ai-patient')
      )
      
      const aiPatientSnapshot = await getDocs(aiPatientQuery)
      console.log('📊 AI Patient query result:', {
        isEmpty: aiPatientSnapshot.empty,
        docsCount: aiPatientSnapshot.docs.length,
        roomCode: roomCode
      })
      
      if (!aiPatientSnapshot.empty) {
        // This is an AI Patient activity - fetch AI Patient leaderboard
        console.log('✅ Detected AI Patient activity, routing to getAIPatientLeaderboard')
        return await this.getAIPatientLeaderboard(roomCode, aiPatientSnapshot)
      }
      
      console.log('📝 No AI Patient activities found, proceeding with regular leaderboard')

      // This is a regular typing activity - use existing logic
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
              status: student.status || 'ready',
              errorsCount: 0 // Default value, will be updated from typing results
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
              status: 'completed',
              errorsCount: 0 // Default value, will be updated from typing results
            })
          })
        }
      }

      // Safely fetch error counts from typing results for each student
      try {
        const typingResultsQuery = query(
          collection(db, 'typingResults'),
          where('roomId', '==', roomCode),
          where('sessionType', '==', 'room')
        )
        
        const typingResultsSnapshot = await getDocs(typingResultsQuery)
        
        if (!typingResultsSnapshot.empty) {
          // Create a map of student ID to their typing result
          const studentErrorsMap = new Map()
          
          typingResultsSnapshot.docs.forEach(doc => {
            const resultData = doc.data()
            if (resultData.userId && typeof resultData.errorsCount === 'number') {
              studentErrorsMap.set(resultData.userId, resultData.errorsCount)
            }
          })
          
          // Update leaderboard with error counts
          leaderboard.forEach(student => {
            if (studentErrorsMap.has(student.id)) {
              student.errorsCount = studentErrorsMap.get(student.id)
            }
          })
          
          console.log(`🏆 Updated ${studentErrorsMap.size} students with error counts from typing results`)
        }
      } catch (errorFetchError) {
        console.warn('⚠️ Could not fetch error counts from typing results:', errorFetchError.message)
        // Continue without error counts - this is safe fallback behavior
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

  // Get AI Patient leaderboard from typingResults
  async getAIPatientLeaderboard(roomCode, aiPatientSnapshot) {
    try {
      console.log('🔍 getAIPatientLeaderboard called for room:', roomCode)
      console.log('📊 Found', aiPatientSnapshot.docs.length, 'snapshot documents')
      
      const leaderboard = []
      
      aiPatientSnapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`🎯 Processing document ${index + 1}:`, {
          docId: doc.id,
          userId: data.userId,
          sessionType: data.sessionType,
          roomId: data.roomId,
          hasAiPatientData: !!data.aiPatientData,
          aiPatientDataKeys: data.aiPatientData ? Object.keys(data.aiPatientData) : [],
          fullData: data
        })
        
        if (data.aiPatientData && data.userId) {
          const studentData = {
             id: data.userId,
             name: data.aiPatientData.studentName || 'Unknown Student',
             score: data.aiPatientData.score || 0,
             feedback: data.aiPatientData.feedback || '',
             patientName: data.aiPatientData.patientName || 'Virtual Patient',
             consultationId: data.aiPatientData.consultationId,
             timestamp: data.timestamp?.toDate() || new Date(),
             hasFeedback: !!(data.aiPatientData.feedback && data.aiPatientData.feedback.trim())
           }
           
           console.log('✅ Adding student to leaderboard:', studentData)
           leaderboard.push(studentData)
        } else {
          console.log('❌ Skipping doc - missing data:', {
            hasAiPatientData: !!data.aiPatientData,
            hasUserId: !!data.userId,
            aiPatientData: data.aiPatientData,
            userId: data.userId
          })
        }
      })
      
      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score)
      
      // Cache the results
      this.cacheLeaderboard(roomCode, leaderboard)
      
      console.log(`🏆 Final AI Patient leaderboard with ${leaderboard.length} students:`, leaderboard)
      
      return leaderboard
      
    } catch (error) {
      console.error('❌ Error fetching AI Patient leaderboard:', error)
      throw error
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