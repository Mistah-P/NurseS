import axios from 'axios'
import sessionService from './sessionService'

// Create axios instance for typing results API
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const typingResultsService = {
  /**
   * Save typing test results to the database
   * @param {Object} resultData - The typing test result data
   * @returns {Promise} API response
   */
  async saveTypingResult(resultData) {
    try {
      const response = await api.post('/typing-results/save', resultData)
      
      return response.data
    } catch (error) {
      console.error('❌ Error saving typing result:', error)
      throw error
    }
  },

  /**
   * Get typing results for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, sessionType, dateFilter)
   * @returns {Promise} API response with typing results
   */
  async getUserTypingResults(userId, options = {}) {
    try {
      const { limit = 10, sessionType, dateFilter } = options
      
      let url = `/typing-results/user/${userId}?limit=${limit}`
      if (sessionType) {
        url += `&sessionType=${sessionType}`
      }
      if (dateFilter) {
        url += `&dateFilter=${dateFilter}`
      }
      
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching typing results:', error)
      throw error
    }
  },

  /**
   * Get typing results for a user by email (for room sessions)
   * @param {string} email - User email
   * @param {Object} options - Query options (limit, sessionType, dateFilter)
   * @returns {Promise} API response with typing results
   */
  async getUserTypingResultsByEmail(email, options = {}) {
    try {
      const { limit = 10, sessionType, dateFilter } = options
      
      let url = `/typing-results/email/${encodeURIComponent(email)}?limit=${limit}`
      if (sessionType) {
        url += `&sessionType=${sessionType}`
      }
      if (dateFilter) {
        url += `&dateFilter=${dateFilter}`
      }
      
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching typing results by email:', error)
      throw error
    }
  },

  /**
   * Get today's typing results for a user, trying both user ID and email approaches
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {Object} options - Query options (limit, sessionType)
   * @returns {Promise} API response with today's typing results only
   */
  async getTodayTypingResults(userId, email, options = {}) {
    try {
      // Add today filter to options
      const todayOptions = { ...options, dateFilter: 'today', limit: 100 }; // Increase limit to get all today's results
      
      // First try by user ID
      try {
        const userIdResults = await this.getUserTypingResults(userId, todayOptions);
        if (userIdResults.success && userIdResults.data.length > 0) {
          console.log('✅ Found today\'s typing results by user ID:', userIdResults.data.length);
          return userIdResults;
        }
      } catch (error) {
        console.log('⚠️ No today\'s results found by user ID, trying email...');
      }

      // If no results by user ID, try by email
      if (email) {
        try {
          const emailResults = await this.getUserTypingResultsByEmail(email, todayOptions);
          if (emailResults.success && emailResults.data.length > 0) {
            console.log('✅ Found today\'s typing results by email:', emailResults.data.length);
            return emailResults;
          }
        } catch (error) {
          console.log('⚠️ No today\'s results found by email either');
        }
      }

      // Return empty result if nothing found
      return {
        success: true,
        data: [],
        count: 0
      };
    } catch (error) {
      console.error('❌ Error fetching today\'s typing results:', error);
      throw error;
    }
  },

  /**
   * Get typing results for a user, trying both user ID and email approaches
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {Object} options - Query options (limit, sessionType, dateFilter)
   * @returns {Promise} API response with typing results
   */
  async getUserTypingResultsComplete(userId, email, options = {}) {
    try {
      // First try by user ID
      try {
        const userIdResults = await this.getUserTypingResults(userId, options)
        if (userIdResults.success && userIdResults.data.length > 0) {
          console.log('✅ Found typing results by user ID:', userIdResults.data.length)
          return userIdResults
        }
      } catch (error) {
        console.log('⚠️ No results found by user ID, trying email...')
      }

      // If no results by user ID, try by email
      if (email) {
        try {
          const emailResults = await this.getUserTypingResultsByEmail(email, options)
          if (emailResults.success && emailResults.data.length > 0) {
            console.log('✅ Found typing results by email:', emailResults.data.length)
            return emailResults
          }
        } catch (error) {
          console.log('⚠️ No results found by email either')
        }
      }

      // Return empty result if nothing found
      return {
        success: true,
        data: [],
        count: 0
      }
    } catch (error) {
      console.error('❌ Error fetching complete typing results:', error)
      throw error
    }
  },

  /**
   * Get typing statistics for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (sessionType, days)
   * @returns {Promise} API response with typing statistics
   */
  async getUserTypingStats(userId, options = {}) {
    try {
      const { sessionType, days = 30 } = options
      
      let url = `/typing-results/user/${userId}/stats?days=${days}`
      if (sessionType) {
        url += `&sessionType=${sessionType}`
      }
      
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching typing statistics:', error)
      throw error
    }
  },

  /**
   * Create typing result data from component state
   * @param {Object} componentData - Data from typing test component
   * @returns {Object} Formatted typing result data
   */
  createTypingResultData(componentData) {
    const {
      userId,
      sessionType = 'practice',
      roomId = null,
      wpm,
      accuracy,
      duration,
      wordsTyped,
      errorsCount = 0,
      totalKeystrokes = 0,
      correctKeystrokes = 0,
      backspaces = 0,
      topic = 'General Practice',
      difficulty = 'Medium',
      textLength = 0,
      commonErrors = []
    } = componentData

    // Calculate average speed
    const averageSpeed = duration > 0 ? (totalKeystrokes / duration) * 60 : 0

    return {
      userId,
      sessionType,
      roomId,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      duration: Math.round(duration),
      wordsTyped: Math.round(wordsTyped),
      errorsCount: Math.round(errorsCount),
      keystrokeData: {
        totalKeystrokes: Math.round(totalKeystrokes),
        correctKeystrokes: Math.round(correctKeystrokes),
        backspaces: Math.round(backspaces),
        averageSpeed: Math.round(averageSpeed * 100) / 100 // Round to 2 decimal places
      },
      content: {
        topic,
        difficulty,
        textLength: Math.round(textLength)
      },
      commonErrors: commonErrors || []
    }
  },

  /**
   * Save typing result from practice mode
   * @param {Object} practiceData - Data from practice mode component
   * @returns {Promise} Save result
   */
  async savePracticeResult(practiceData) {
    try {
      // Get current user session
      const userSession = await sessionService.getCurrentSession()
      if (!userSession || !userSession.userId) {
        throw new Error('User session not found')
      }

      const resultData = this.createTypingResultData({
        userId: userSession.userId,
        sessionType: 'practice',
        ...practiceData
      })

      return await this.saveTypingResult(resultData)
    } catch (error) {
      console.error('❌ Error saving practice result:', error)
      throw error
    }
  },

  /**
   * Save typing result from room-based typing test
   * @param {Object} roomData - Data from room typing test component
   * @returns {Promise} Save result
   */
  async saveRoomResult(roomData) {
    try {
      // Get current student session
      const studentSession = await sessionService.getStudentSession()
      if (!studentSession || !studentSession.studentData) {
        throw new Error('Student session not found')
      }

      // Fetch room information to get module and difficulty
      let roomModule = 'General Practice'
      let roomDifficulty = 'Medium'
      
      if (roomData.roomCode) {
        try {
          // Import Firebase here to avoid circular dependencies
          const { collection, query, where, getDocs } = await import('firebase/firestore')
          const { db } = await import('../firebase/init')
          
          // Query room by roomCode to get module and difficulty
          const roomQuery = query(
            collection(db, 'rooms'),
            where('roomCode', '==', roomData.roomCode.toUpperCase())
          )
          
          const roomSnapshot = await getDocs(roomQuery)
          
          if (!roomSnapshot.empty) {
            const roomDoc = roomSnapshot.docs[0]
            const roomInfo = roomDoc.data()
            
            // Extract module and difficulty from room data
            roomModule = roomInfo.module || 'General Practice'
            roomDifficulty = roomInfo.difficultyLevel || 'Medium'
            
            console.log('✅ Room info fetched:', { 
              roomCode: roomData.roomCode, 
              module: roomModule, 
              difficulty: roomDifficulty 
            })
          } else {
            console.warn('⚠️ Room not found for code:', roomData.roomCode)
          }
        } catch (fetchError) {
          console.error('❌ Error fetching room info:', fetchError)
          // Continue with default values if room fetch fails
        }
      }

      const resultData = this.createTypingResultData({
        userId: studentSession.studentData.studentId,
        sessionType: 'room',
        roomId: roomData.roomCode,
        topic: roomModule,
        difficulty: roomDifficulty,
        ...roomData
      })

      return await this.saveTypingResult(resultData)
    } catch (error) {
      console.error('❌ Error saving room result:', error)
      throw error
    }
  }
}

export default typingResultsService