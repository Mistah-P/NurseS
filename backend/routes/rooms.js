const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const db = admin.firestore();

// Validation schemas
const createRoomSchema = Joi.object({
  activityName: Joi.string().required().min(1).max(100),
  section: Joi.string().required().min(1).max(50),
  yearLevel: Joi.string().required().min(1).max(20),
  mode: Joi.string().required().valid('Timed', 'Word Count Challenge', 'AI Patient'),
  duration: Joi.number().integer().min(0).max(180).allow(null),
  wordCount: Joi.number().integer().min(0).max(500).allow(null),
  module: Joi.string().required().min(1).max(100),
  difficultyLevel: Joi.string().required().valid('Easy', 'Normal', 'Hard', 'Interactive'),
  teacherId: Joi.string().required(),
  teacherName: Joi.string().required(),
  roomType: Joi.string().optional().valid('Typing Test', 'AI Patient').default('Typing Test')
}).custom((value, helpers) => {
  // Validation for Typing Test rooms (existing functionality)
  if (value.mode === 'Timed') {
    if (!value.duration || value.duration < 1) {
      return helpers.error('custom.timedDurationRequired');
    }
  }
  if (value.mode === 'Word Count Challenge') {
    if (!value.wordCount || value.wordCount < 10) {
      return helpers.error('custom.wordCountRequired');
    }
  }
  
  // Validation for AI Patient rooms (new functionality)
  if (value.mode === 'AI Patient') {
    // AI Patient rooms don't need duration or wordCount
    // Set roomType to 'AI Patient' if not already set
    if (!value.roomType) {
      value.roomType = 'AI Patient';
    }
  }
  
  return value;
}, 'Mode validation').messages({
  'custom.timedDurationRequired': 'Duration must be at least 1 minute for Timed mode',
  'custom.wordCountRequired': 'Word count must be at least 10 words for Word Count Challenge mode'
});

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if room code exists
async function isRoomCodeUnique(roomCode) {
  try {
    const snapshot = await db.collection('rooms').where('roomCode', '==', roomCode).get();
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking room code uniqueness:', error);
    
    // If quota exceeded, assume the code is unique (very low collision probability)
    if (error.code === 8 || error.message.includes('Quota exceeded')) {
      console.warn('⚠️ Quota exceeded during uniqueness check, assuming code is unique');
      return true;
    }
    
    return false;
  }
}

// Generate unique room code with optimized retry logic
async function generateUniqueRoomCode() {
  let roomCode;
  let attempts = 0;
  const maxAttempts = 3; // Reduced from 10 to 3 since collisions are extremely rare

  do {
    roomCode = generateRoomCode();
    attempts++;
    
    // For first attempt, always check uniqueness
    // For subsequent attempts, add a small delay to avoid rapid-fire queries
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
    
  } while (!(await isRoomCodeUnique(roomCode)) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    // If we still can't generate a unique code, try a timestamp-based approach
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).toUpperCase().slice(-2);
    roomCode = timestamp + random;
    console.warn('⚠️ Using timestamp-based room code as fallback:', roomCode);
  }

  return roomCode;
}

// POST /api/rooms - Create new room
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createRoomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Generate unique room code
    const roomCode = await generateUniqueRoomCode();
    const roomId = uuidv4();

    // Create room data
    const roomData = {
      id: roomId,
      roomCode,
      ...value,
      status: 'waiting', // waiting, active, completed
      studentsJoined: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('rooms').doc(roomId).set(roomData);

    console.log(`✅ Room created: ${roomCode} (${roomData.activityName})`);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        id: roomId,
        roomCode,
        activityName: value.activityName,
        section: value.section,
        yearLevel: value.yearLevel,
        mode: value.mode,
        duration: value.duration,
        wordCount: value.wordCount,
        module: value.module,
        difficultyLevel: value.difficultyLevel,
        roomType: value.roomType,
        status: 'waiting',
        studentsJoined: []
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    
    // Handle specific Firestore quota exceeded errors
    if (error.code === 8 || error.message.includes('Quota exceeded')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database quota exceeded. Please try again in a few minutes.',
        retryAfter: 300 // 5 minutes
      });
    }
    
    // Handle other Firestore errors
    if (error.code && error.code >= 3 && error.code <= 16) {
      return res.status(503).json({
        error: 'Database service error',
        message: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create room',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

// GET /api/rooms/:roomCode - Get room by room code
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    if (!roomCode || roomCode.length !== 6) {
      return res.status(400).json({
        error: 'Invalid room code format'
      });
    }

    const snapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'No room exists with this code'
      });
    }

    const roomDoc = snapshot.docs[0];
    const roomData = roomDoc.data();

    // Convert Firestore timestamps to ISO strings
    const responseData = {
      ...roomData,
      createdAt: roomData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: roomData.updatedAt?.toDate?.()?.toISOString() || null
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      error: 'Failed to fetch room',
      message: error.message
    });
  }
});

// GET /api/rooms - Get all rooms (with optional teacher filter)
router.get('/', async (req, res) => {
  try {
    const { teacherId, status } = req.query;
    let query = db.collection('rooms');

    if (teacherId) {
      query = query.where('teacherId', '==', teacherId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const rooms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    });

    res.json({
      success: true,
      data: rooms,
      count: rooms.length
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
});

// PUT /api/rooms/:roomCode/status - Update room status
router.put('/:roomCode/status', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { status } = req.body;

    if (!['waiting', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be: waiting, active, or completed'
      });
    }

    const snapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    const roomDoc = snapshot.docs[0];
    await roomDoc.ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Room status updated successfully',
      data: { roomCode, status }
    });

  } catch (error) {
    console.error('Error updating room status:', error);
    res.status(500).json({
      error: 'Failed to update room status',
      message: error.message
    });
  }
});

// DELETE /api/rooms/:roomCode - Delete room
router.delete('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const snapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }

    const roomDoc = snapshot.docs[0];
    await roomDoc.ref.delete();

    console.log(`🗑️ Room deleted: ${roomCode}`);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      error: 'Failed to delete room',
      message: error.message
    });
  }
});

module.exports = router;