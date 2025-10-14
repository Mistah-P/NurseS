import { createRouter, createWebHistory } from 'vue-router'
import sessionService from '@/services/sessionService'
import teacherDataService from '@/services/teacherDataService'
import { auth } from '@/firebase/init'
import { onAuthStateChanged } from 'firebase/auth'

// Core views
import NotLoggedIn from '@/components/NotLoggedIn.vue'
import UserPage from '@/components/UserPage.vue'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'

// Student components
import PracticeMode from '@/components/PracticeMode.vue'
import AIPatient from '@/components/AIPatient.vue'
import StudentSettings from '@/components/Settings.vue'
import StudentRoomInterface from '@/components/Student Side/StudentRoomInterface.vue'
import TypingTest from '@/components/Student Side/TypingTest.vue'

// Teacher components
import TeacherDashboard from '@/components/Teacher Side/TeacherDashboard.vue'
import TypingHistory from '@/components/Teacher Side/TypingHistory.vue'
import RoomInterface from '@/components/Teacher Side/RoomInterface.vue'
import Leaderboards from '@/components/Teacher Side/Leaderboards.vue'
import TeacherSettings from '@/components/Teacher Side/Settings.vue'

// Admin components
import AdminPanel from '@/views/AdminPanel.vue'

const routes = [
  { path: '/', name: 'NotLoggedIn', component: NotLoggedIn, alias: ['/notloggedin'] },
  { path: '/user', name: 'UserPage', component: UserPage },
  { path: '/login', name: 'LoginForm', component: LoginForm },
  { path: '/register', name: 'RegisterForm', component: RegisterForm, alias: ['/registerform'] },

  // Student routes
  { path: '/practice-mode', name: 'PracticeMode', component: PracticeMode },
  { path: '/ai-patient', name: 'AIPatient', component: AIPatient },
  { path: '/settings', name: 'Settings', component: StudentSettings },
  { path: '/student-room/:roomCode', name: 'StudentRoomInterface', component: StudentRoomInterface, props: true },
  { path: '/typing-test/:roomCode', name: 'TypingTest', component: TypingTest, props: true },

  // Teacher routes
  { path: '/teacher-dashboard', name: 'TeacherDashboard', component: TeacherDashboard },
  { path: '/typing-history', name: 'TypingHistory', component: TypingHistory },
  { path: '/leaderboards', name: 'Leaderboards', component: Leaderboards },
  { path: '/teacher-settings', name: 'TeacherSettings', component: TeacherSettings },
  { path: '/room/:roomCode?', name: 'RoomInterface', component: RoomInterface, props: true },
  
  // Admin routes
  { path: '/admin', name: 'AdminPanel', component: AdminPanel, meta: { requiresAdmin: true } },
  { path: '/admin/login', redirect: '/admin' },

  // Optional catch-all
  // { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for admin and teacher routes
router.beforeEach(async (to, from, next) => {
  // Handle admin routes
  if (to.meta.requiresAdmin) {
    try {
      // Check if valid admin session exists in Firebase
      const adminSession = await sessionService.getAdminSession();
      
      if (!adminSession) {
        // No admin session, allow access to show login
        next();
        return;
      }
      
      // No expiration check - admin sessions are permanent
      // (All user types can login anytime)
    } catch (error) {
      console.error('Error checking admin session:', error);
      // Continue to allow access to show login on error
    }
  }
  
  // Handle teacher routes - prevent logout on refresh
  const teacherRoutes = ['/teacher-dashboard', '/typing-history', '/leaderboards', '/teacher-settings', '/room'];
  const isTeacherRoute = teacherRoutes.some(route => to.path.startsWith(route));
  
  if (isTeacherRoute) {
    try {
      // Wait for Firebase auth state to be determined
      const user = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });
      
      if (user) {
        // Preload teacher data to avoid delays in components
        await teacherDataService.getTeacherData();
        
        // Check if teacher session exists in Firestore by userId
        const teacherSession = await sessionService.getTeacherSession(user.uid);
        
        if (teacherSession && teacherSession.userType === 'teacher' && teacherSession.isActive) {
          // Valid teacher session, allow navigation
          next();
          return;
        }
      }
      
      // No valid teacher session, redirect to login only if not already on login page
      if (to.path !== '/login') {
        console.warn('No valid teacher session found, redirecting to login');
        next('/login');
        return;
      }
    } catch (error) {
      console.error('Error checking teacher session:', error);
      // On error, allow navigation to prevent infinite loops
    }
  }
  
  next();
});

export default router
