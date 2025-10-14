const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');

const router = express.Router();
const db = admin.firestore();

// Validation schemas
const startActivitySchema = Joi.object({
  countdownDuration: Joi.number().integer().min(5).max(30).default(10),
  moduleContent: Joi.string().required().min(3), // Allow module identifiers like 'nursing-ethics'
  timeLimit: Joi.number().integer().min(0).default(0), // 0 means no time limit for word count mode
  wordCount: Joi.number().integer().min(0).default(0), // 0 means no word count limit for timed mode
  settings: Joi.object({
    showLeaderboard: Joi.boolean().default(true),
    allowLateJoin: Joi.boolean().default(false),
    autoEndAfterCompletion: Joi.boolean().default(true),
    gameMode: Joi.string().valid('timed', 'word-count').default('timed'),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium')
  }).default({})
});

const studentProgressSchema = Joi.object({
  studentId: Joi.string().required(),
  wpm: Joi.number().min(0).max(300),
  accuracy: Joi.number().min(0).max(100),
  progress: Joi.number().min(0).max(100),
  currentPosition: Joi.number().min(0),
  status: Joi.string().valid('ready', 'typing', 'completed')
});

// POST /api/rooms/:roomCode/start-activity - Start live typing competition
router.post('/:roomCode/start-activity', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Validate request body
    const { error, value } = startActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Find the room
    const roomSnapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (roomSnapshot.empty) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    const roomDoc = roomSnapshot.docs[0];
    const roomData = roomDoc.data();

    if (roomData.status !== 'waiting') {
      return res.status(400).json({
        error: 'Invalid room status',
        message: 'Room must be in waiting status to start activity'
      });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    
    // Update room with live activity data
    await roomDoc.ref.update({
      status: 'active',
      'liveActivity.isActive': true,
      'liveActivity.startedAt': now,
      'liveActivity.countdownStartedAt': now,
      'liveActivity.countdownDuration': value.countdownDuration,
      'liveActivity.moduleContent': value.moduleContent,
      'liveActivity.timeLimit': value.timeLimit,
      'liveActivity.settings': value.settings,
      updatedAt: now
    });

    // Create live session document
    const liveSessionData = {
      roomCode: roomCode.toUpperCase(),
      roomId: roomData.id,
      status: 'countdown',
      startedAt: null, // Will be set when activity becomes active
      countdownStartedAt: now,
      countdownDuration: value.countdownDuration,
      moduleContent: value.moduleContent,
      timeLimit: value.timeLimit,
      wordCount: value.wordCount, // Include word count for word-count mode
      settings: value.settings,
      difficulty: roomData.difficultyLevel || 'Intermediate', // Include room difficulty level
      studentProgress: {},
      leaderboard: [],
      createdAt: now,
      updatedAt: now
    };

    // Initialize student progress for all joined students
    if (roomData.studentsJoined && roomData.studentsJoined.length > 0) {
      roomData.studentsJoined.forEach(student => {
        liveSessionData.studentProgress[student.studentId] = {
          studentId: student.studentId,
          studentName: student.studentName,
          status: 'ready',
          wpm: 0,
          accuracy: 100,
          progress: 0,
          currentPosition: 0,
          startedTypingAt: null,
          completedAt: null,
          lastUpdate: now
        };
      });
    }

    await db.collection('liveSessions').doc(roomCode.toUpperCase()).set(liveSessionData);

    // Set up automatic transition from countdown to active after countdown expires
    setTimeout(async () => {
      try {
        const liveSessionRef = db.collection('liveSessions').doc(roomCode.toUpperCase());
        const currentDoc = await liveSessionRef.get();
        
        // Only transition if still in countdown status (prevent race conditions)
        if (currentDoc.exists && currentDoc.data().status === 'countdown') {
          await liveSessionRef.update({
            status: 'active',
            startedAt: admin.firestore.FieldValue.serverTimestamp(), // Set startedAt when activity becomes active
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`⏰ Auto-transitioned ${roomCode} from countdown to active`);
        }
      } catch (error) {
        console.error(`❌ Error auto-transitioning ${roomCode}:`, error);
      }
    }, value.countdownDuration * 1000); // Convert seconds to milliseconds

    console.log(`🚀 Live activity started: ${roomCode}`);

    // Initialize leaderboard with all students
    await updateLeaderboard(roomCode.toUpperCase());

    res.json({
      success: true,
      message: 'Live activity started successfully',
      data: {
        roomCode: roomCode.toUpperCase(),
        status: 'countdown',
        countdownDuration: value.countdownDuration,
        studentsCount: roomData.studentsJoined?.length || 0
      }
    });

  } catch (error) {
    console.error('Error starting live activity:', error);
    res.status(500).json({
      error: 'Failed to start live activity',
      message: error.message
    });
  }
});

// GET /api/live-sessions/:roomCode - Get live session data
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const liveSessionDoc = await db.collection('liveSessions')
      .doc(roomCode.toUpperCase())
      .get();

    if (!liveSessionDoc.exists) {
      return res.status(404).json({
        error: 'Live session not found'
      });
    }

    const liveSessionData = liveSessionDoc.data();

    // Convert Firestore timestamps to ISO strings
    const responseData = {
      ...liveSessionData,
      startedAt: liveSessionData.startedAt?.toDate?.()?.toISOString() || null,
      countdownStartedAt: liveSessionData.countdownStartedAt?.toDate?.()?.toISOString() || null,
      createdAt: liveSessionData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: liveSessionData.updatedAt?.toDate?.()?.toISOString() || null
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching live session:', error);
    res.status(500).json({
      error: 'Failed to fetch live session',
      message: error.message
    });
  }
});

// PUT /api/live-sessions/:roomCode/student-progress - Update student progress
router.put('/:roomCode/student-progress', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Validate request body
    const { error, value } = studentProgressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const liveSessionRef = db.collection('liveSessions').doc(roomCode.toUpperCase());
    const liveSessionDoc = await liveSessionRef.get();

    if (!liveSessionDoc.exists) {
      return res.status(404).json({
        error: 'Live session not found'
      });
    }

    const liveSessionData = liveSessionDoc.data();
    
    if (liveSessionData.status === 'completed') {
      return res.status(400).json({
        error: 'Session completed',
        message: 'Cannot update progress for completed session'
      });
    }

    // Update student progress
    const studentProgressUpdate = {
      [`studentProgress.${value.studentId}.wpm`]: value.wpm || 0,
      [`studentProgress.${value.studentId}.accuracy`]: value.accuracy || 100,
      [`studentProgress.${value.studentId}.progress`]: value.progress || 0,
      [`studentProgress.${value.studentId}.currentPosition`]: value.currentPosition || 0,
      [`studentProgress.${value.studentId}.lastUpdate`]: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (value.status) {
      studentProgressUpdate[`studentProgress.${value.studentId}.status`] = value.status;
      
      if (value.status === 'typing' && !liveSessionData.studentProgress[value.studentId]?.startedTypingAt) {
        studentProgressUpdate[`studentProgress.${value.studentId}.startedTypingAt`] = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (value.status === 'completed') {
        studentProgressUpdate[`studentProgress.${value.studentId}.completedAt`] = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    await liveSessionRef.update(studentProgressUpdate);

    // Recalculate leaderboard
    await updateLeaderboard(roomCode.toUpperCase());

    res.json({
      success: true,
      message: 'Student progress updated successfully',
      data: {
        studentId: value.studentId,
        wpm: value.wpm,
        accuracy: value.accuracy,
        progress: value.progress
      }
    });

  } catch (error) {
    console.error('Error updating student progress:', error);
    res.status(500).json({
      error: 'Failed to update student progress',
      message: error.message
    });
  }
});

// GET /api/live-sessions/:roomCode/leaderboard - Get current leaderboard
router.get('/:roomCode/leaderboard', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const liveSessionDoc = await db.collection('liveSessions')
      .doc(roomCode.toUpperCase())
      .get();

    if (!liveSessionDoc.exists) {
      return res.status(404).json({
        error: 'Live session not found'
      });
    }

    const liveSessionData = liveSessionDoc.data();

    res.json({
      success: true,
      data: liveSessionData.leaderboard || []
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

// POST /api/rooms/:roomCode/end-activity - End live typing competition
router.post('/:roomCode/end-activity', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Find the room
    const roomSnapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (roomSnapshot.empty) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    const roomDoc = roomSnapshot.docs[0];
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Update room status
    await roomDoc.ref.update({
      status: 'completed',
      'liveActivity.isActive': false,
      updatedAt: now
    });

    // Update live session status
    const liveSessionRef = db.collection('liveSessions').doc(roomCode.toUpperCase());
    await liveSessionRef.update({
      status: 'completed',
      updatedAt: now
    });

    console.log(`🏁 Live activity ended: ${roomCode}`);

    res.json({
      success: true,
      message: 'Live activity ended successfully',
      data: {
        roomCode: roomCode.toUpperCase(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error ending live activity:', error);
    res.status(500).json({
      error: 'Failed to end live activity',
      message: error.message
    });
  }
});

// Helper function to update leaderboard
async function updateLeaderboard(roomCode) {
  try {
    const liveSessionRef = db.collection('liveSessions').doc(roomCode);
    const liveSessionDoc = await liveSessionRef.get();
    
    if (!liveSessionDoc.exists) return;
    
    const liveSessionData = liveSessionDoc.data();
    const studentProgress = liveSessionData.studentProgress || {};
    
    // Calculate leaderboard - Include ALL students, even those who haven't started
    const leaderboard = Object.values(studentProgress)
      .sort((a, b) => {
        // Sort by progress first, then by WPM, then by accuracy
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        return b.accuracy - a.accuracy;
      })
      .map((student, index) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        rank: index + 1,
        wpm: student.wpm || 0,
        accuracy: student.accuracy || 100,
        progress: student.progress || 0,
        status: student.status || 'ready'
      }));
    
    // Update leaderboard in live session
    await liveSessionRef.update({
      leaderboard,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`📊 Updated leaderboard for ${roomCode}: ${leaderboard.length} students`);
    
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

module.exports = router;