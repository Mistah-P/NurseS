import axios from 'axios'
import sessionService from './sessionService'
import { auth } from '../firebase/init'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Get auth token from Firebase using sessionService
        const token = await sessionService.getAuthToken(currentUser.uid);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Continue without token if there's an error
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Room API endpoints
export const roomAPI = {
  // Create new room
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create room')
    }
  },

  // Get room by room code
  getRoomByCode: async (roomCode) => {
    try {
      const response = await api.get(`/rooms/${roomCode}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch room')
    }
  },

  // Get all rooms (with optional filters)
  getRooms: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/rooms${params ? '?' + params : ''}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch rooms')
    }
  },

  // Update room status
  updateRoomStatus: async (roomCode, status) => {
    try {
      const response = await api.put(`/rooms/${roomCode}/status`, { status })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update room status')
    }
  },

  // Delete room
  deleteRoom: async (roomCode) => {
    try {
      const response = await api.delete(`/rooms/${roomCode}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete room')
    }
  },

  // Start live activity
  startActivity: async (roomCode, activityData) => {
    try {
      const response = await api.post(`/rooms/${roomCode}/start-activity`, activityData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start activity')
    }
  },

  // End live activity
  endActivity: async (roomCode) => {
    try {
      const response = await api.post(`/rooms/${roomCode}/end-activity`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to end activity')
    }
  }
}

// Live Session API endpoints
export const liveSessionAPI = {
  // Get live session data
  getLiveSession: async (roomCode) => {
    try {
      const response = await api.get(`/live-sessions/${roomCode}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live session')
    }
  },

  // Update student progress in live session
  updateStudentProgress: async (roomCode, studentId, progressData) => {
    try {
      const response = await api.put(`/live-sessions/${roomCode}/student-progress`, {
        studentId,
        ...progressData
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update student progress')
    }
  },

  // Get current leaderboard
  getLeaderboard: async (roomCode) => {
    try {
      const response = await api.get(`/live-sessions/${roomCode}/leaderboard`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard')
    }
  },

  // Start live typing activity
  startActivity: (roomCode, activityData) => 
    api.post(`/live-sessions/${roomCode}/start-activity`, activityData),
  
  // End live typing activity
  endActivity: (roomCode) => 
    api.post(`/live-sessions/${roomCode}/end-activity`)
}

// Student API endpoints
export const studentAPI = {
  // Join room
  joinRoom: async (joinData) => {
    try {
      const response = await api.post('/students/join-room', joinData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join room')
    }
  },

  // Update student progress
  updateProgress: async (studentId, progressData) => {
    try {
      const response = await api.put(`/students/${studentId}/progress`, progressData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update progress')
    }
  },

  // Leave room
  leaveRoom: async (studentId, roomCode) => {
    try {
      const response = await api.delete(`/students/${studentId}/leave-room`, {
        data: { roomCode }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to leave room')
    }
  },

  // Get students in room
  getStudentsInRoom: async (roomCode) => {
    try {
      const response = await api.get(`/students/room/${roomCode}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch students')
    }
  }
}

// Admin API endpoints
export const adminAPI = {
  // Create new teacher
  createTeacher: async (teacherData) => {
    try {
      const response = await api.post('/admin/teachers', teacherData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create teacher')
    }
  },

  // Get all teachers
  getTeachers: async (adminId) => {
    try {
      const response = await api.get(`/admin/teachers?adminId=${adminId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teachers')
    }
  },

  // Deactivate teacher
  deactivateTeacher: async (teacherId, adminId) => {
    try {
      const response = await api.delete(`/admin/teachers/${teacherId}`, {
        data: { adminId }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to deactivate teacher')
    }
  }
}

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    throw new Error('Backend server is not responding')
  }
}



export default {
  roomAPI,
  studentAPI,
  adminAPI,
  liveSessionAPI
};