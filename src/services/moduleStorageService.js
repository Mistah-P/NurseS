import { db } from '../firebase/init'
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'

class ModuleStorageService {
  constructor() {
    this.modulesCollection = 'modules'
  }

  /**
   * Upload all module files to Firestore
   * This method should be called once to migrate from file-based to database storage
   */
  async uploadModulesToDatabase() {
    try {
      
      // Define ALL 17 modules based on actual files in src/module directory
      const modules = [
        {
          id: 'community-health-nursing',
          filename: 'Community Health Nursing.txt',
          label: 'Community Health Nursing',
          description: 'Community-based nursing practice and public health concepts',
          category: 'Community Health',
          difficulty: 'Intermediate',
          estimatedTime: 12,
          wordCount: 0,
          content: ''
        },
        {
          id: 'critical-care-nursing',
          filename: 'Critical Care Nursing.txt',
          label: 'Critical Care Nursing',
          description: 'Intensive care and critical patient management',
          category: 'Critical Care',
          difficulty: 'Advanced',
          estimatedTime: 18,
          wordCount: 0,
          content: ''
        },
        {
          id: 'disaster-nursing',
          filename: 'Disaster Nursing.txt',
          label: 'Disaster Nursing',
          description: 'Emergency response and disaster management in nursing',
          category: 'Emergency',
          difficulty: 'Advanced',
          estimatedTime: 14,
          wordCount: 0,
          content: ''
        },
        {
          id: 'emergency-nursing',
          filename: 'Emergency Nursing.txt',
          label: 'Emergency Nursing',
          description: 'Emergency department nursing and acute care',
          category: 'Emergency',
          difficulty: 'Advanced',
          estimatedTime: 16,
          wordCount: 0,
          content: ''
        },
        {
          id: 'fundamentals-of-nursing-practice',
          filename: 'Fundamentals of Nursing Practice.TXT',
          label: 'Fundamentals of Nursing Practice',
          description: 'Basic nursing principles and fundamental practices',
          category: 'Fundamentals',
          difficulty: 'Beginner',
          estimatedTime: 10,
          wordCount: 0,
          content: ''
        },
        {
          id: 'gerontologic-nursing',
          filename: 'Gerontologic Nursing.txt',
          label: 'Gerontologic Nursing',
          description: 'Elderly care and gerontological nursing practices',
          category: 'Geriatrics',
          difficulty: 'Intermediate',
          estimatedTime: 13,
          wordCount: 0,
          content: ''
        },
        {
          id: 'health-assessment-terminologies',
          filename: 'Health Assessment Terminologies.txt',
          label: 'Health Assessment Terminologies',
          description: 'Medical terminology and health assessment concepts',
          category: 'Assessment',
          difficulty: 'Intermediate',
          estimatedTime: 11,
          wordCount: 0,
          content: ''
        },
        {
          id: 'health-education',
          filename: 'Health Education.txt',
          label: 'Health Education',
          description: 'Patient education and health promotion strategies',
          category: 'Education',
          difficulty: 'Intermediate',
          estimatedTime: 12,
          wordCount: 0,
          content: ''
        },
        {
          id: 'maternal-and-child-nursing',
          filename: 'Maternal and Child Nursing.txt',
          label: 'Maternal and Child Nursing',
          description: 'Obstetric and pediatric nursing care',
          category: 'Maternal-Child',
          difficulty: 'Intermediate',
          estimatedTime: 15,
          wordCount: 0,
          content: ''
        },
        {
          id: 'medical-and-surgical-nursing',
          filename: 'Medical and Surgical Nursing.txt',
          label: 'Medical and Surgical Nursing',
          description: 'Adult health nursing and surgical care procedures',
          category: 'Medical-Surgical',
          difficulty: 'Intermediate',
          estimatedTime: 18,
          wordCount: 0,
          content: ''
        },
        {
          id: 'mental-health-and-psychiatric-nursing',
          filename: 'Mental Health and Psychiatric Nursing.txt',
          label: 'Mental Health and Psychiatric Nursing',
          description: 'Mental health nursing and psychiatric care',
          category: 'Mental Health',
          difficulty: 'Advanced',
          estimatedTime: 16,
          wordCount: 0,
          content: ''
        },
        {
          id: 'nursing-ethics',
          filename: 'Nursing Ethics.txt',
          label: 'Nursing Ethics',
          description: 'Ethical principles and moral decision-making in nursing',
          category: 'Ethics',
          difficulty: 'Intermediate',
          estimatedTime: 10,
          wordCount: 0,
          content: ''
        },
        {
          id: 'nursing-leadership-and-management',
          filename: 'Nursing Leadership and Management.txt',
          label: 'Nursing Leadership and Management',
          description: 'Leadership skills and management principles in nursing',
          category: 'Management',
          difficulty: 'Advanced',
          estimatedTime: 14,
          wordCount: 0,
          content: ''
        },
        {
          id: 'nursing-research',
          filename: 'Nursing Research.txt',
          label: 'Nursing Research',
          description: 'Research methodologies and evidence-based practice in nursing',
          category: 'Research',
          difficulty: 'Advanced',
          estimatedTime: 15,
          wordCount: 0,
          content: ''
        },
        {
          id: 'nutrition-and-dietetics',
          filename: 'Nutrition and Dietetics.txt',
          label: 'Nutrition and Dietetics',
          description: 'Nutritional assessment and dietary management',
          category: 'Nutrition',
          difficulty: 'Intermediate',
          estimatedTime: 12,
          wordCount: 0,
          content: ''
        },
        {
          id: 'psychiatric-nursing',
          filename: 'Psychiatric Nursing.txt',
          label: 'Psychiatric Nursing',
          description: 'Psychiatric nursing care and mental health interventions',
          category: 'Mental Health',
          difficulty: 'Advanced',
          estimatedTime: 16,
          wordCount: 0,
          content: ''
        },
        {
          id: 'theoretical-foundations-in-nursing',
          filename: 'Theoretical Foundations in Nursing.txt',
          label: 'Theoretical Foundations in Nursing',
          description: 'Nursing theories and conceptual frameworks',
          category: 'Theory',
          difficulty: 'Intermediate',
          estimatedTime: 13,
          wordCount: 0,
          content: ''
        }
      ]

      // Load content from files and upload to Firestore
      for (const module of modules) {
        try {
          // Fetch content from public/module directory
          const response = await fetch(`/module/${module.filename}`)
          if (response.ok) {
            const content = await response.text()
            module.content = content.trim()
            module.wordCount = content.trim().split(/\s+/).length
            
            // Upload to Firestore
            await setDoc(doc(db, this.modulesCollection, module.id), {
              ...module,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              isActive: true
            })
            
          } else {
            console.warn(`⚠️ Could not load content for ${module.filename}`)
          }
        } catch (error) {
          console.error(`❌ Error uploading module ${module.id}:`, error)
        }
      }
      
      return true
    } catch (error) {
      console.error('❌ Error uploading modules to database:', error)
      throw error
    }
  }

  /**
   * Get all modules from Firestore
   */
  async getAllModules() {
    try {
      const modulesQuery = query(
        collection(db, this.modulesCollection),
        orderBy('label')
      )
      const snapshot = await getDocs(modulesQuery)
      
      const modules = []
      snapshot.forEach(doc => {
        modules.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return modules
    } catch (error) {
      console.error('❌ Error fetching modules from database:', error)
      throw error
    }
  }

  /**
   * Get a specific module by ID from Firestore
   */
  async getModuleById(moduleId) {
    try {
      const docRef = doc(db, this.modulesCollection, moduleId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        throw new Error(`Module not found: ${moduleId}`)
      }
    } catch (error) {
      console.error(`❌ Error fetching module ${moduleId}:`, error)
      throw error
    }
  }

  /**
   * Get module content by ID
   */
  async getModuleContent(moduleId) {
    try {
      const module = await this.getModuleById(moduleId)
      return module.content
    } catch (error) {
      console.error(`❌ Error getting content for module ${moduleId}:`, error)
      throw error
    }
  }

  /**
   * Update module content in Firestore
   */
  async updateModuleContent(moduleId, content) {
    try {
      const docRef = doc(db, this.modulesCollection, moduleId)
      const wordCount = content.trim().split(/\s+/).length
      
      await setDoc(docRef, {
        content: content.trim(),
        wordCount,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      return true
    } catch (error) {
      console.error(`❌ Error updating module ${moduleId}:`, error)
      throw error
    }
  }

  /**
   * Clear all modules from database (for re-upload)
   */
  async clearAllModules() {
    try {
      const snapshot = await getDocs(collection(db, this.modulesCollection))
      
      const deletePromises = []
      snapshot.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      
      await Promise.all(deletePromises)
      return true
    } catch (error) {
      // Handle permission errors gracefully without breaking functionality
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Insufficient permissions to clear modules. Skipping module clearing.')
        return false // Return false to indicate clearing was skipped
      }
      
      console.error('❌ Error clearing modules:', error)
      throw error
    }
  }

  /**
   * Check if modules exist in database
   */
  async checkModulesExist() {
    try {
      const snapshot = await getDocs(collection(db, this.modulesCollection))
      return !snapshot.empty
    } catch (error) {
      console.error('❌ Error checking modules existence:', error)
      return false
    }
  }
}

export default new ModuleStorageService()