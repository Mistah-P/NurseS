# NurseScript Backend API

Backend API for NurseScript - Medical Typing Education Platform with Firebase Integration.

## Features

- Room creation and management
- Student joining and progress tracking
- Real-time data synchronization with Firebase Firestore
- RESTful API endpoints
- Input validation and error handling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

4. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

5. Fill in your Firebase configuration in `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-client-cert-url
```

### 3. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:roomCode` - Get room by code
- `GET /api/rooms` - Get all rooms (with optional filters)
- `PUT /api/rooms/:roomCode/status` - Update room status
- `DELETE /api/rooms/:roomCode` - Delete room

### Students
- `POST /api/students/join-room` - Join a room
- `PUT /api/students/:studentId/progress` - Update student progress
- `DELETE /api/students/:studentId/leave-room` - Leave room
- `GET /api/students/room/:roomCode` - Get students in room

## Database Schema

### Rooms Collection
```javascript
{
  id: "uuid",
  roomCode: "ABC123",
  activityName: "Medical Terminology Practice",
  section: "Section A",
  yearLevel: "Year 1",
  mode: "Practice", // Practice, Timed, Challenge
  duration: 30, // minutes
  module: "Basic Medical Terms",
  difficultyLevel: "Beginner", // Beginner, Intermediate, Advanced
  teacherId: "teacher-uuid",
  teacherName: "Dr. Smith",
  status: "waiting", // waiting, active, completed
  studentsJoined: [
    {
      studentId: "student-uuid",
      studentName: "John Doe",
      email: "john@example.com",
      yearLevel: "Year 1",
      section: "Section A",
      joinedAt: "timestamp",
      status: "joined", // joined, active, completed
      wpm: 45,
      accuracy: 95,
      progress: 75
    }
  ],
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": ["Validation errors if applicable"]
}
```

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:8081` (Vue.js frontend)

Update `FRONTEND_URL` in `.env` to change the allowed origin.

## Development

- Use `npm run dev` for development with auto-restart
- Check logs for Firebase connection status
- Test endpoints using the health check: `GET /api/health`