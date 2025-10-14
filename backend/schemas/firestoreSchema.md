# Firestore Schema for localStorage Migration

## Collections Structure

### 1. users (existing - enhanced)
```
users/{userId}
{
  // Existing fields
  name: string,
  email: string,
  userType: 'admin' | 'teacher' | 'student',
  createdAt: timestamp,
  
  // New session fields
  currentSession: {
    isActive: boolean,
    loginTime: timestamp,
    lastActivity: timestamp,
    deviceInfo: string,
    ipAddress: string
  },
  
  // User preferences
  preferences: {
    theme: 'dark' | 'light' | 'auto',
    notifications: boolean,
    language: string
  }
}
```

### 2. sessions (new collection)
```
sessions/{sessionId}
{
  userId: string,
  userType: 'admin' | 'teacher' | 'student',
  isActive: boolean,
  loginTime: timestamp,
  lastActivity: timestamp,
  expiresAt: timestamp,
  deviceInfo: string,
  ipAddress: string,
  
  // Type-specific data
  adminData?: {
    adminId: string,
    permissions: array
  },
  
  teacherData?: {
    teacherEmail: string,
    institution: string,
    department: string
  },
  
  studentData?: {
    currentRoom?: {
      roomCode: string,
      studentId: string,
      studentName: string,
      joinedAt: timestamp,
      status: 'joined' | 'active' | 'completed'
    }
  }
}
```

### 3. teacherPreferences (new collection)
```
teacherPreferences/{teacherId}
{
  userId: string,
  preferences: {
    theme: string,
    notifications: boolean,
    autoSave: boolean,
    defaultSettings: object
  },
  updatedAt: timestamp
}
```

### 4. studentSessions (new collection)
```
studentSessions/{sessionId}
{
  studentId: string,
  roomCode: string,
  studentName: string,
  joinedAt: timestamp,
  status: 'joined' | 'active' | 'completed',
  progress: {
    currentExercise: string,
    completedExercises: array,
    score: number
  },
  isActive: boolean
}
```

### 5. authTokens (new collection)
```
authTokens/{tokenId}
{
  userId: string,
  token: string,
  createdAt: timestamp,
  expiresAt: timestamp,
  isActive: boolean,
  deviceInfo: string
}
```

## Migration Strategy

1. **Phase 1**: Create session management service
2. **Phase 2**: Migrate admin authentication
3. **Phase 3**: Migrate teacher authentication  
4. **Phase 4**: Migrate student sessions
5. **Phase 5**: Replace all localStorage calls
6. **Phase 6**: Implement real-time sync
7. **Phase 7**: Testing and validation

## Security Considerations

- All sessions are permanent (no expiration) - users can login anytime
- Real-time validation of session status
- Manual session cleanup when needed
- Device tracking for security
- IP address logging for audit trails