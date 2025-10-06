import { createRouter, createWebHistory } from 'vue-router'

// Core views
import NotLoggedIn from '@/components/NotLoggedIn.vue'
import LoggedIn from '@/components/LoggedIn.vue'
import UserPage from '@/components/UserPage.vue'
import Highscore from '@/components/Highscore.vue'
import AboutNS from '@/components/AboutNS.vue'
import SettingsPage from '@/components/SettingsPage.vue'
import LoginForm from '@/components/LoginForm.vue'
import RegisterForm from '@/components/RegisterForm.vue'
import Customize from '@/components/Customize.vue'
import Results from '@/components/Results.vue'

// Typing mode pages (lazy-loaded; ensure these files exist in src/components)
const Words = () => import('@/components/typingmodes/WordsMode.vue')
const Time = () => import('@/components/typingmodes/TimeMode.vue')
const Diagnosis = () => import('@/components/typingmodes/DiagnosisMode.vue')
const DoctorsPrescrip = () => import('@/components/typingmodes/DoctorsPrescrip.vue')
const PatientInterview = () => import('@/components/typingmodes/PatientInterview.vue')
const NervousSys = () => import('@/components/typingmodes/NervousSys.vue')
const CirculatorySys = () => import('@/components/typingmodes/CirculatorySys.vue')
const RespiratorySys = () => import('@/components/typingmodes/RespiratorySys.vue')
const NursingNotes = () => import('@/components/typingmodes/NursingNotes.vue')
const DischargeInstruc = () => import('@/components/typingmodes/DischargeInstruc.vue')

const routes = [
  { path: '/', name: 'NotLoggedIn', component: NotLoggedIn, alias: ['/notloggedin'] },
  { path: '/loggedin', name: 'LoggedIn', component: LoggedIn },
  { path: '/user', name: 'UserPage', component: UserPage },
  { path: '/highscore', name: 'Highscore', component: Highscore },
  { path: '/aboutns', name: 'AboutNS', component: AboutNS },
  { path: '/settings', name: 'SettingsPage', component: SettingsPage },
  { path: '/login', name: 'LoginForm', component: LoginForm },
  { path: '/register', name: 'RegisterForm', component: RegisterForm, alias: ['/registerform'] },
  { path: '/customize', name: 'Customize', component: Customize },
  { path: '/results', name: 'Results', component: Results },

  // Typing modes (match your Customize.vue redirections)
  { path: '/words', name: 'WordsMode', component: Words },
  { path: '/time', name: 'TimeMode', component: Time },
  { path: '/diagnosis', name: 'DiagnosisMode', component: Diagnosis },
  { path: '/doctorsprescrip', name: 'DoctorsPrescrip', component: DoctorsPrescrip },
  { path: '/patientinterview', name: 'PatientInterview', component: PatientInterview },
  { path: '/nervoussys', name: 'NervousSys', component: NervousSys },
  { path: '/circulatorysys', name: 'CirculatorySys', component: CirculatorySys },
  { path: '/respiratorysys', name: 'RespiratorySys', component: RespiratorySys },
  { path: '/nursingnotes', name: 'NursingNotes', component: NursingNotes },
  { path: '/dischargeinstruc', name: 'DischargeInstruc', component: DischargeInstruc },

  // Optional catch-all
  // { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
