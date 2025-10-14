import { db } from '../firebase/init';
import { 
  collection, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';

class LeaderboardService {
  constructor() {
    // Cache for performance optimization
    this.cache = {
      allTypingResults: null,
      allRooms: null,
      availableModules: null,
      studentPerformanceData: new Map(), // Cache by module filter
      lastCacheUpdate: null,
      cacheExpiry: 5 * 60 * 1000 // 5 minutes cache
    };
  }

  /**
   * Check if cache is valid
   */
  isCacheValid() {
    return this.cache.lastCacheUpdate && 
           (Date.now() - this.cache.lastCacheUpdate) < this.cache.cacheExpiry;
  }

  /**
   * Load all typing results in one batch query for caching
   */
  async loadAllTypingResults() {
    if (this.cache.allTypingResults && this.isCacheValid()) {
      return this.cache.allTypingResults;
    }

    try {
      const typingResultsSnapshot = await getDocs(collection(db, 'typingResults'));
      
      // Group results by userId for fast lookup
      const resultsByUser = new Map();
      
      typingResultsSnapshot.docs.forEach(doc => {
        const result = doc.data();
        const userId = result.userId;
        
        if (!resultsByUser.has(userId)) {
          resultsByUser.set(userId, []);
        }
        
        resultsByUser.get(userId).push({
          wpm: result.wpm || 0,
          accuracy: result.accuracy || 0,
          section: result.content?.topic || result.section || 'Unknown',
          timestamp: result.timestamp || result.createdAt || null
        });
      });

      // Find best result for each user
      const bestResultsByUser = new Map();
      resultsByUser.forEach((results, userId) => {
        let bestResult = { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
        
        results.forEach(result => {
          if (result.wpm > bestResult.wpm) {
            bestResult = result;
          }
        });
        
        bestResultsByUser.set(userId, bestResult);
      });

      this.cache.allTypingResults = bestResultsByUser;
      this.cache.lastCacheUpdate = Date.now();
      
      return bestResultsByUser;
    } catch (error) {
      console.error('❌ Error loading all typing results:', error);
      return new Map();
    }
  }

  /**
   * Load all rooms in one batch query for caching
   */
  async loadAllRooms() {
    if (this.cache.allRooms && this.isCacheValid()) {
      return this.cache.allRooms;
    }

    try {
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      this.cache.allRooms = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return this.cache.allRooms;
    } catch (error) {
      console.error('❌ Error loading all rooms:', error);
      return [];
    }
  }

  /**
   * Get best typing results for a student from cache
   * @param {string} studentId - Student ID to fetch results for
   * @returns {Promise<Object>} Best typing results for the student with timestamp
   */
  async getBestTypingResults(studentId) {
    try {
      const allResults = await this.loadAllTypingResults();
      return allResults.get(studentId) || { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
    } catch (error) {
      console.error('❌ Error fetching typing results for student:', studentId, error);
      return { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
    }
  }

  /**
   * Get absolute best typing results across multiple student IDs for the same person
   * @param {Array} studentIds - Array of student IDs to check
   * @returns {Promise<Object>} Absolute best typing results across all IDs
   */
  async getBestTypingResultsAcrossIds(studentIds) {
    try {
      const allResults = await this.loadAllTypingResults();
      let absoluteBest = { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
      
      for (const studentId of studentIds) {
        const results = allResults.get(studentId) || { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
        if (results.wpm > absoluteBest.wpm) {
          absoluteBest = results;
        }
      }
      
      return absoluteBest;
    } catch (error) {
      console.error('❌ Error fetching best results across IDs:', error);
      return { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
    }
  }

  /**
   * Get student performance data for public leaderboard with caching
   * @param {string|null} moduleFilter - Optional module to filter by
   * @returns {Promise<Array>} Array of student performance data
   */
  async getStudentPerformanceData(moduleFilter = null) {
    try {
      // Check cache first
      const cacheKey = moduleFilter || 'all';
      if (this.cache.studentPerformanceData.has(cacheKey) && this.isCacheValid()) {
        return this.cache.studentPerformanceData.get(cacheKey);
      }

      // Load all data in batch
      const [allTypingResults, allRooms] = await Promise.all([
        this.loadAllTypingResults(),
        this.loadAllRooms()
      ]);
      
      if (allRooms.length === 0) {
        return [];
      }
      
      const studentPerformanceMap = new Map();
      
      // Process each room
      for (const roomData of allRooms) {
        // Skip if module filter is applied and doesn't match
        const roomModule = roomData.module || roomData.moduleContent;
        if (moduleFilter && roomModule !== moduleFilter) {
          continue;
        }
        
        // Process students in this room
        if (roomData.studentsJoined && Array.isArray(roomData.studentsJoined)) {
          for (const student of roomData.studentsJoined) {
            // Use student name + module as the primary key
            // This allows students to appear once per module with their best performance in that module
            const studentKey = `${student.studentName}_${roomModule}`;
            
            // Get best typing results for this student from cache (no database call!)
            const typingResults = allTypingResults.get(student.studentId) || 
                                { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
            
            if (!studentPerformanceMap.has(studentKey)) {
              // First time seeing this student in this module - add them with their best results
              studentPerformanceMap.set(studentKey, {
                studentId: student.studentId,
                studentName: student.studentName,
                section: roomData.section || 'Unknown Section',
                bestModule: roomModule,
                wpm: typingResults.wpm,
                accuracy: typingResults.accuracy,
                testsCompleted: 1,
                lastActive: typingResults.timestamp ? 
                  (typingResults.timestamp.toDate ? typingResults.timestamp.toDate() : new Date(typingResults.timestamp)) : 
                  new Date(),
                allStudentIds: [student.studentId] // Track all student IDs for this person in this module
              });
            } else {
              // Student already exists in this module - consolidate their best results within this module
              const existingStudent = studentPerformanceMap.get(studentKey);
              
              // Add this student ID to the list if not already present
              if (!existingStudent.allStudentIds.includes(student.studentId)) {
                existingStudent.allStudentIds.push(student.studentId);
                existingStudent.testsCompleted++;
                
                // Compare with cached results (no database call!)
                if (typingResults.wpm > existingStudent.wpm) {
                  existingStudent.wpm = typingResults.wpm;
                  existingStudent.accuracy = typingResults.accuracy;
                  // Keep the room section, don't overwrite with typing results section
                  existingStudent.lastActive = typingResults.timestamp ? 
                    (typingResults.timestamp.toDate ? typingResults.timestamp.toDate() : new Date(typingResults.timestamp)) : 
                    new Date();
                  existingStudent.studentId = student.studentId; // Update to the ID with best performance
                }
              }
            }
          }
        }
      }
      
      // Convert map to array and sort by WPM descending
      const studentsArray = Array.from(studentPerformanceMap.values())
        .sort((a, b) => b.wpm - a.wpm);
      
      // Set display name (no duplicates since we consolidated by name)
      studentsArray.forEach(student => {
        student.displayName = student.studentName;
      });
      
      // Cache the result
      this.cache.studentPerformanceData.set(cacheKey, studentsArray);
      
      return studentsArray;
      
    } catch (error) {
      console.error('❌ Error fetching student performance data:', error);
      throw error;
    }
  }

  /**
   * Get available modules for public leaderboard with caching
   * @returns {Promise<Array>} Array of unique module names
   */
  async getAvailableModules() {
    try {
      // Check cache first
      if (this.cache.availableModules && this.isCacheValid()) {
        return this.cache.availableModules;
      }

      // Load from cache or database
      const allRooms = await this.loadAllRooms();
      
      if (allRooms.length === 0) {
        return [];
      }
      
      // Extract unique modules
      const modulesSet = new Set();
      allRooms.forEach(roomData => {
        const roomModule = roomData.module || roomData.moduleContent;
        if (roomModule) {
          modulesSet.add(roomModule);
        }
      });
      
      // Convert to array format expected by the component
      const modules = Array.from(modulesSet).map(module => ({
        label: module,
        value: module
      }));
      
      // Cache the result
      this.cache.availableModules = modules;
      
      return modules;
      
    } catch (error) {
      console.error('❌ Error fetching available modules:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data for a specific room
   * @param {string} roomCode - Room code to get leaderboard for
   * @returns {Promise<Array>} Array of student leaderboard data
   */
  async getLeaderboard(roomCode) {
    try {
      const roomDoc = await getDoc(doc(db, 'rooms', roomCode));
      
      if (!roomDoc.exists()) {
        return [];
      }
      
      const roomData = roomDoc.data();
      
      if (!roomData.studentsJoined || !Array.isArray(roomData.studentsJoined)) {
        return [];
      }
      
      // Load all typing results for performance
      const allTypingResults = await this.loadAllTypingResults();
      
      const leaderboard = [];
      
      for (const student of roomData.studentsJoined) {
        // Get best typing results from cache
        const typingResults = allTypingResults.get(student.studentId) || 
                            { wpm: 0, accuracy: 0, section: 'Unknown', timestamp: null };
        
        leaderboard.push({
          studentId: student.studentId,
          studentName: student.studentName,
          wpm: typingResults.wpm,
          accuracy: typingResults.accuracy,
          lastActive: typingResults.timestamp ? 
            (typingResults.timestamp.toDate ? typingResults.timestamp.toDate() : new Date(typingResults.timestamp)) : 
            new Date()
        });
      }
      
      // Sort by WPM descending
      leaderboard.sort((a, b) => b.wpm - a.wpm);
      
      return leaderboard;
      
    } catch (error) {
      console.error('❌ Error fetching leaderboard for room:', roomCode, error);
      throw error;
    }
  }

  /**
   * Clear cache (useful for forcing refresh)
   */
  clearCache() {
    this.cache = {
      allTypingResults: null,
      allRooms: null,
      availableModules: null,
      studentPerformanceData: new Map(),
      lastCacheUpdate: null,
      cacheExpiry: 5 * 60 * 1000 // 5 minutes cache
    };
  }

  /**
   * Refresh cache (force reload from database)
   */
  async refreshCache() {
    this.clearCache();
    // Pre-load cache
    await Promise.all([
      this.loadAllTypingResults(),
      this.loadAllRooms()
    ]);
  }
}

export default new LeaderboardService();