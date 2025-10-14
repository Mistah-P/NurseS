# Live Typing Competition - Firebase Schema Design

## Enhanced Rooms Collection

```javascript
// rooms/{roomId}
{
  // Existing fields
  id: "uuid",
  roomCode: "ABC123",
  activityName: "Medical Terminology Practice",
  section: "Section A",
  yearLevel: "Year 1",
  mode: "Timed", // Timed, Word Count Challenge
  duration: 30, // minutes (for Timed mode)
  wordCount: 100, // target words (for Word Count Challenge mode)
  module: "Basic Medical Terms",
  difficultyLevel: "Beginner",
  teacherId: "teacher-uuid",
  teacherName: "Dr. Smith",
  status: "waiting", // waiting, active, completed
  studentsJoined: [...],
  createdAt: "timestamp",
  updatedAt: "timestamp",

  // NEW: Live Competition Fields
  liveActivity: {
    isActive: false,
    startedAt: null, // timestamp when activity started
    countdownStartedAt: null, // timestamp when countdown began
    countdownDuration: 10, // seconds for countdown
    moduleContent: "sample typing content...", // words for typing test
    settings: {
      showLeaderboard: true,
      allowLateJoin: false,
      autoEndAfterCompletion: true
    }
  }
}
```

## New Collection: Live Sessions

```javascript
// liveSessions/{roomCode}
{
  roomCode: "ABC123",
  roomId: "room-uuid",
  status: "waiting", // waiting, countdown, active, completed
  startedAt: null,
  countdownStartedAt: null,
  countdownDuration: 10,
  gameMode: "timed", // timed, word-count
  timeLimit: 1800, // seconds (for timed mode)
  wordCount: 100, // target words (for word-count mode)
  
  // Real-time student progress
  studentProgress: {
    "student-id-1": {
      studentId: "student-id-1",
      studentName: "John Doe",
      status: "ready", // ready, typing, completed
      wpm: 0,
      accuracy: 100,
      progress: 0, // percentage completed
      currentPosition: 0, // character position in text
      wordsTyped: 0, // words completed (for word-count mode)
      startedTypingAt: null,
      completedAt: null,
      lastUpdate: "timestamp"
    },
    "student-id-2": {
      // ... similar structure
    }
  },
  
  // Leaderboard (computed from studentProgress)
  leaderboard: [
    {
      studentId: "student-id-1",
      studentName: "John Doe",
      rank: 1,
      wpm: 45,
      accuracy: 98,
      progress: 85,
      wordsTyped: 42 // for word-count mode
    }
  ],
  
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Enhanced Student Sessions

```javascript
// sessions/{sessionId} - Enhanced studentData
{
  // Existing fields...
  studentData: {
    // Existing fields...
    currentRoom: {
      roomCode: "ABC123",
      studentId: "student-uuid",
      studentName: "John Doe",
      joinedAt: "timestamp",
      status: "joined"
    },
    
    // NEW: Live Activity Data
    liveActivity: {
      isParticipating: false,
      activityStartedAt: null,
      typingStartedAt: null,
      currentWPM: 0,
      currentAccuracy: 100,
      currentProgress: 0,
      currentPosition: 0,
      completedAt: null
    }
  }
}
```

## Real-time Update Flow

### 1. Teacher Starts Activity
```
1. Teacher clicks "Start Activity"
2. Update rooms/{roomId}/liveActivity/isActive = true
3. Create/Update liveSessions/{roomCode} with countdown
4. All students listening to liveSessions/{roomCode} get real-time update
5. Students automatically redirect to typing test with countdown
```

### 2. Student Typing Progress
```
1. Student types in typing test
2. Update liveSessions/{roomCode}/studentProgress/{studentId}
3. Recalculate leaderboard in real-time
4. Teacher sees live leaderboard updates
5. Other students see live rankings
```

### 3. Activity Completion
```
1. All students complete or time expires
2. Update rooms/{roomId}/status = "completed"
3. Update liveSessions/{roomCode}/status = "completed"
4. Final leaderboard is saved
5. Students see final results
```

## Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Live Sessions - Teachers can write, students can read
    match /liveSessions/{roomCode} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (isTeacher() || isUpdatingOwnProgress(resource, request));
    }
    
    // Students can only update their own progress
    function isUpdatingOwnProgress(resource, request) {
      return request.auth.uid in resource.data.studentProgress &&
             onlyUpdatingAllowedFields(request.resource.data, resource.data);
    }
    
    function onlyUpdatingAllowedFields(newData, oldData) {
      let allowedFields = ['wpm', 'accuracy', 'progress', 'currentPosition', 'lastUpdate'];
      return newData.diff(oldData).affectedKeys().hasOnly(allowedFields);
    }
  }
}
```

## API Endpoints

### New Endpoints Needed

```javascript
// POST /api/rooms/:roomCode/start-activity
// Start live typing competition

// PUT /api/live-sessions/:roomCode/student-progress
// Update student typing progress in real-time

// GET /api/live-sessions/:roomCode/leaderboard
// Get current leaderboard (fallback for real-time)

// POST /api/rooms/:roomCode/end-activity
// End live typing competition
```

## Real-time Listeners Implementation

### Teacher Side (RoomInterface.vue)
```javascript
// Listen for live session updates
const unsubscribe = onSnapshot(
  doc(db, 'liveSessions', roomCode),
  (doc) => {
    if (doc.exists()) {
      this.liveSession = doc.data();
      this.updateLeaderboard(doc.data().leaderboard);
    }
  }
);
```

### Student Side (StudentRoomInterface.vue)
```javascript
// Listen for activity start
const unsubscribe = onSnapshot(
  doc(db, 'liveSessions', roomCode),
  (doc) => {
    if (doc.exists() && doc.data().status === 'countdown') {
      this.redirectToTypingTest();
    }
  }
);
```

This schema ensures:
- ✅ Real-time updates using Firebase listeners (no localStorage)
- ✅ Scalable leaderboard system
- ✅ Automatic student redirection
- ✅ Live WPM and accuracy tracking
- ✅ Secure data access controls
- ✅ Countdown timer functionality