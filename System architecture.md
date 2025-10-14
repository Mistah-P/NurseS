# 🏥 NurseScript - Medical Typing Training System

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Architecture](#api-architecture)
- [Deployment Options](#deployment-options)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)

## 🎯 Overview

**NurseScript** is a comprehensive medical typing training system designed to help nursing students and healthcare professionals improve their typing skills through specialized medical content, AI-powered patient simulations, and real-time collaborative learning environments.

### Key Objectives
- 🎯 **Medical-Focused Training**: Specialized typing exercises with medical terminology
- 🤖 **AI Patient Simulation**: Interactive patient consultation scenarios
- 👥 **Collaborative Learning**: Teacher-managed rooms for group practice
- 📊 **Progress Tracking**: Comprehensive analytics and performance metrics
- 🏆 **Gamification**: Leaderboards, streaks, and achievement systems

## 🏗️ System Architecture

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    NurseScript System                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Vue.js)          │  Backend (Node.js)            │
│  ├── User Interface         │  ├── API Services             │
│  ├── Real-time Features     │  ├── AI Integration           │
│  ├── Firebase Client        │  ├── Business Logic           │
│  └── State Management       │  └── Firebase Admin           │
├─────────────────────────────────────────────────────────────┤
│                Firebase Cloud Services                      │
│  ├── Authentication        │  ├── Cloud Functions          │
│  ├── Firestore Database    │  ├── Cloud Storage            │
│  ├── Realtime Database     │  └── Hosting                  │
└─────────────────────────────────────────────────────────────┘
```

### Hybrid Architecture Benefits
- **Frontend**: Handles UI/UX, real-time features, and simple operations
- **Backend**: Manages complex logic, AI integrations, and secure operations
- **Firebase**: Provides scalable infrastructure and real-time capabilities

## 🛠️ Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vue.js** | 3.5.20 | Progressive web framework |
| **Vue Router** | 4.5.1 | Client-side routing |
| **Bootstrap** | 5.3.8 | UI component library |
| **Chart.js** | 4.5.0 | Data visualization |
| **Vue-ChartJS** | 5.3.2 | Vue wrapper for Chart.js |
| **Firebase SDK** | 12.2.1 | Client-side Firebase integration |

### Backend Stack (Recommended)
| Technology | Purpose |
|------------|---------|
| **Node.js** | Server runtime |
| **Express.js** | Web framework |
| **Firebase Admin** | Server-side Firebase operations |
| **OpenAI API** | AI patient simulation |
| **SendGrid/Nodemailer** | Email notifications |
| **Joi/Yup** | Data validation |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Firebase Auth** | User authentication |
| **Firestore** | NoSQL database |
| **Firebase Hosting** | Static site hosting |
| **Cloud Functions** | Serverless backend |
| **Firebase Storage** | File storage |

## 📁 Project Structure

```
NurseScript/
├── NurseScript/                    # Frontend Application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── src/
│   │   ├── components/             # Vue Components
│   │   │   ├── Teacher Side/       # Teacher-specific components
│   │   │   │   ├── TeacherDashboard.vue
│   │   │   │   ├── RoomInterface.vue
│   │   │   │   ├── TypingHistory.vue
│   │   │   │   ├── Leaderboards.vue
│   │   │   │   ├── CreateRoomModal.vue
│   │   │   │   ├── LeaderboardModal.vue
│   │   │   │   └── Settings.vue
│   │   │   ├── shared/             # Shared components
│   │   │   ├── AIPatient.vue       # AI simulation interface
│   │   │   ├── PracticeMode.vue    # Typing practice
│   │   │   ├── UserPage.vue        # Student dashboard
│   │   │   ├── LoginForm.vue       # Authentication
│   │   │   ├── RegisterForm.vue    # User registration
│   │   │   ├── Settings.vue        # User settings
│   │   │   ├── GlobalHeader.vue    # Navigation
│   │   │   └── NotLoggedIn.vue     # Landing page
│   │   ├── firebase/               # Firebase configuration
│   │   │   └── init.js
│   │   ├── router/                 # Vue Router setup
│   │   │   └── index.js
│   │   ├── assets/                 # Static assets
│   │   ├── App.vue                 # Root component
│   │   └── main.js                 # Application entry
│   ├── package.json                # Dependencies
│   ├── vue.config.js              # Vue CLI configuration
│   └── babel.config.js            # Babel configuration
├── backend/                        # Backend API (Recommended)
│   ├── src/
│   │   ├── routes/                 # API routes
│   │   ├── controllers/            # Business logic
│   │   ├── middleware/             # Custom middleware
│   │   ├── services/               # External services
│   │   ├── models/                 # Data models
│   │   └── utils/                  # Utility functions
│   ├── package.json
│   └── server.js
└── README.md                       # This file
```

## ✨ Features

### 👨‍🎓 Student Features
- **🏠 Dashboard**: Personal progress, statistics, and achievements
- **⌨️ Practice Mode**: Customizable typing exercises (time/word-based)
- **🤖 AI Patient**: Interactive patient consultation simulations
- **📊 Progress Tracking**: WPM, accuracy, and improvement analytics
- **🏆 Achievements**: Streaks, personal bests, and milestones
- **🎯 Topic Selection**: Medical terminology and specialized content
- **👥 Room Participation**: Join teacher-created practice rooms

### 👩‍🏫 Teacher Features
- **📋 Dashboard**: Overview of students, rooms, and analytics
- **🏠 Room Management**: Create and manage practice sessions
- **📈 Analytics**: Student progress and performance insights
- **🏆 Leaderboards**: Class rankings and competitions
- **📚 Typing History**: Detailed student performance records
- **⚙️ Settings**: Room configuration and preferences
- **📧 Notifications**: Student progress alerts

### 🔧 System Features
- **🔐 Authentication**: Secure user registration and login
- **⚡ Real-time**: Live typing sessions and updates
- **📱 Responsive**: Mobile-friendly interface
- **🎨 Theming**: Light/dark mode support
- **🔔 Notifications**: In-app and email alerts
- **📊 Analytics**: Comprehensive performance metrics

## 🗄️ Database Schema

### Firebase Firestore Collections

#### Users Collection
```javascript
users/{userId} = {
  // Basic Information
  name: string,
  email: string,
  userType: "student" | "teacher",
  createdAt: timestamp,
  
  // Profile Settings
  preferences: {
    theme: "light" | "dark",
    notifications: boolean,
    language: string
  },
  
  // Student-specific
  stats?: {
    totalTests: number,
    averageWPM: number,
    averageAccuracy: number,
    practiceTime: number,        // in minutes
    currentStreak: number,
    longestStreak: number,
    joinedRooms: string[]
  },
  
  // Teacher-specific
  teacherData?: {
    institution: string,
    activeRooms: string[],
    totalStudents: number
  }
}
```

#### Rooms Collection
```javascript
rooms/{roomCode} = {
  // Room Information
  roomCode: string,
  teacherId: string,
  teacherName: string,
  roomName: string,
  isActive: boolean,
  createdAt: timestamp,
  
  // Room Settings
  settings: {
    duration: number,           // in minutes
    mode: "time" | "words",
    wordCount?: number,
    topic: string,
    difficulty: "easy" | "medium" | "hard"
  },
  
  // Participants
  students: {
    [userId]: {
      name: string,
      joinedAt: timestamp,
      isActive: boolean
    }
  },
  
  // Session Data
  currentSession?: {
    startTime: timestamp,
    endTime?: timestamp,
    isActive: boolean,
    content: string
  }
}
```

#### Typing Results Collection
```javascript
typingResults/{resultId} = {
  // Session Information
  userId: string,
  roomId?: string,
  sessionType: "practice" | "room" | "ai-patient",
  timestamp: timestamp,
  
  // Performance Metrics
  wpm: number,
  accuracy: number,
  duration: number,            // in seconds
  wordsTyped: number,
  errorsCount: number,
  
  // Detailed Analysis
  keystrokeData: {
    totalKeystrokes: number,
    correctKeystrokes: number,
    backspaces: number,
    averageSpeed: number
  },
  
  // Content Information
  content: {
    topic: string,
    difficulty: string,
    textLength: number
  },
  
  // Error Analysis
  commonErrors: [
    {
      character: string,
      count: number,
      positions: number[]
    }
  ]
}
```

#### AI Patient Sessions Collection
```javascript
aiPatientSessions/{sessionId} = {
  // Session Information
  userId: string,
  sessionId: string,
  startTime: timestamp,
  endTime?: timestamp,
  
  // Conversation Data
  messages: [
    {
      role: "user" | "ai" | "system",
      content: string,
      timestamp: timestamp,
      metadata?: object
    }
  ],
  
  // Medical Assessment
  patientScenario: {
    condition: string,
    symptoms: string[],
    difficulty: "beginner" | "intermediate" | "advanced"
  },
  
  // Student Performance
  assessment: {
    questionsAsked: number,
    appropriateQuestions: number,
    diagnosis: string,
    recommendations: string[],
    completionTime: number,
    score?: number
  }
}
```

## 🔌 API Architecture

### Recommended Backend API Endpoints

#### Authentication & Users
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/users/profile          # Get user profile
PUT    /api/users/profile          # Update user profile
GET    /api/users/stats            # Get user statistics
```

#### Typing Practice
```
POST   /api/typing/start-session   # Start typing session
POST   /api/typing/submit-result   # Submit typing results
GET    /api/typing/history         # Get typing history
GET    /api/typing/analytics       # Get performance analytics
GET    /api/typing/content         # Get practice content
```

#### Room Management
```
POST   /api/rooms/create           # Create new room
GET    /api/rooms/:code            # Get room details
POST   /api/rooms/:code/join       # Join room
DELETE /api/rooms/:code/leave      # Leave room
PUT    /api/rooms/:code/settings   # Update room settings
GET    /api/rooms/teacher/:id      # Get teacher's rooms
```

#### AI Patient System
```
POST   /api/ai-patient/start       # Start AI session
POST   /api/ai-patient/chat        # Send message to AI
POST   /api/ai-patient/submit      # Submit assessment
GET    /api/ai-patient/scenarios   # Get available scenarios
GET    /api/ai-patient/history     # Get session history
```

#### Analytics & Reporting
```
GET    /api/analytics/student/:id  # Student analytics
GET    /api/analytics/room/:code   # Room analytics
GET    /api/analytics/leaderboard  # Leaderboard data
GET    /api/reports/progress       # Progress reports
```

## 🚀 Deployment Options

### Option 1: Frontend-Only (Quick Start)
**Best for**: MVP, testing, immediate deployment

**Architecture**: Vue.js + Firebase Client SDK
- ✅ **Pros**: Simple, fast deployment, low cost
- ❌ **Cons**: Limited AI features, basic analytics

**Deployment Platforms**:
- Firebase Hosting
- Netlify
- Vercel
- GitHub Pages

### Option 2: Full-Stack (Production Ready)
**Best for**: Complete features, scalability, production

**Architecture**: Vue.js + Node.js Backend + Firebase
- ✅ **Pros**: Full features, secure, scalable
- ❌ **Cons**: More complex, higher cost

**Deployment Platforms**:
- **Frontend**: Firebase Hosting, Netlify, Vercel
- **Backend**: Railway, Render, Heroku, Firebase Functions
- **Database**: Firebase Firestore

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Git

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd NurseScript/NurseScript

# Install dependencies
npm install

# Configure Firebase
# Update src/firebase/init.js with your Firebase config

# Start development server
npm run serve
```

### Backend Setup (Optional)
```bash
# Navigate to backend directory
cd ../backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```

### Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Update `src/firebase/init.js` with your config
5. Set up security rules

## 👨‍💻 Development Guide

### Code Structure Guidelines
- **Components**: Reusable Vue components in `/components`
- **Views**: Page-level components for routing
- **Services**: API calls and business logic
- **Utils**: Helper functions and utilities
- **Styles**: Global styles and theme variables

### Naming Conventions
- **Files**: PascalCase for components (`UserPage.vue`)
- **Variables**: camelCase (`userName`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **CSS Classes**: kebab-case (`user-profile`, `typing-area`)

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/bug-description
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
```

### Testing Strategy
- **Unit Tests**: Component logic testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

## 📊 Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Asset Optimization**: Image compression, minification
- **Caching**: Service worker implementation
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Optimization
- **Database Indexing**: Firestore composite indexes
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: API endpoint protection
- **Monitoring**: Performance and error tracking

## 🔒 Security Best Practices

### Authentication & Authorization
- Firebase Authentication integration
- Role-based access control (RBAC)
- JWT token validation
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure API endpoints

### Privacy Compliance
- GDPR compliance measures
- Data encryption at rest and in transit
- User consent management
- Data retention policies

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Code Review Guidelines
- Code quality and standards
- Test coverage requirements
- Documentation updates
- Performance impact assessment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: support@nursescript.com
- 📚 Documentation: [docs.nursescript.com](https://docs.nursescript.com)
- 🐛 Issues: [GitHub Issues](https://github.com/nursescript/issues)

---

**Built with ❤️ for healthcare education**