import { collection, query, where, getDocs, limit, orderBy, startAfter } from 'firebase/firestore';
import { db } from '../firebase/init';

class StudentSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search for students by name or email
   * @param {string} searchTerm - The search term (name or email)
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} Array of student objects
   */
  async searchStudents(searchTerm, maxResults = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const normalizedTerm = searchTerm.trim().toLowerCase();
      const cacheKey = `search_${normalizedTerm}_${maxResults}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      const students = [];
      const usersRef = collection(db, 'users');

      // Search by name (case-insensitive partial match)
      const nameQuery = query(
        usersRef,
        where('userType', '==', 'student'),
        orderBy('name'),
        limit(maxResults)
      );

      const nameSnapshot = await getDocs(nameQuery);
      nameSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(normalizedTerm)) {
          students.push({
            id: doc.id,
            name: data.name,
            email: data.email || 'No email provided',
            userType: data.userType,
            stats: data.stats || {},
            createdAt: data.createdAt
          });
        }
      });

      // Search by email if it looks like an email
      if (normalizedTerm.includes('@')) {
        const emailQuery = query(
          usersRef,
          where('userType', '==', 'student'),
          where('email', '>=', normalizedTerm),
          where('email', '<=', normalizedTerm + '\uf8ff'),
          limit(maxResults)
        );

        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Avoid duplicates
          if (!students.find(s => s.id === doc.id)) {
            students.push({
              id: doc.id,
              name: data.name,
              email: data.email || 'No email provided',
              userType: data.userType,
              stats: data.stats || {},
              createdAt: data.createdAt
            });
          }
        });
      }

      // Remove duplicates and limit results
      const uniqueStudents = students
        .filter((student, index, self) => 
          index === self.findIndex(s => s.id === student.id)
        )
        .slice(0, maxResults);

      // Cache the results
      this.cache.set(cacheKey, {
        data: uniqueStudents,
        timestamp: Date.now()
      });

      return uniqueStudents;

    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }

  /**
   * Get all students (for admin purposes, with pagination)
   * @param {number} pageSize - Number of students per page
   * @param {string} lastStudentId - ID of the last student from previous page
   * @returns {Promise<Object>} Object with students array and pagination info
   */
  async getAllStudents(pageSize = 20, lastStudentId = null) {
    try {
      const usersRef = collection(db, 'users');
      let studentsQuery = query(
        usersRef,
        where('userType', '==', 'student'),
        orderBy('name'),
        limit(pageSize)
      );

      // If we have a lastStudentId, start after that document
      if (lastStudentId) {
        const lastDoc = await getDocs(query(usersRef, where('__name__', '==', lastStudentId)));
        if (!lastDoc.empty) {
          studentsQuery = query(
            usersRef,
            where('userType', '==', 'student'),
            orderBy('name'),
            startAfter(lastDoc.docs[0]),
            limit(pageSize)
          );
        }
      }

      const snapshot = await getDocs(studentsQuery);
      const students = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        students.push({
          id: doc.id,
          name: data.name,
          email: data.email || 'No email provided',
          userType: data.userType,
          stats: data.stats || {},
          createdAt: data.createdAt
        });
      });

      return {
        students,
        hasMore: students.length === pageSize,
        lastStudentId: students.length > 0 ? students[students.length - 1].id : null
      };

    } catch (error) {
      console.error('Error getting all students:', error);
      throw new Error('Failed to get students');
    }
  }

  /**
   * Clear the search cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get student by ID
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object|null>} Student object or null if not found
   */
  async getStudentById(studentId) {
    try {
      const usersRef = collection(db, 'users');
      const studentQuery = query(
        usersRef,
        where('__name__', '==', studentId),
        where('userType', '==', 'student')
      );

      const snapshot = await getDocs(studentQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        email: data.email || 'No email provided',
        userType: data.userType,
        stats: data.stats || {},
        createdAt: data.createdAt
      };

    } catch (error) {
      console.error('Error getting student by ID:', error);
      throw new Error('Failed to get student');
    }
  }
}

// Export a singleton instance
export default new StudentSearchService();