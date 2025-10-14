const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');

const router = express.Router();
const db = admin.firestore();

// Validation schema for typing results
const typingResultSchema = Joi.object({
  userId: Joi.string().required(),
  sessionType: Joi.string().valid('practice', 'room', 'ai-patient').required(),
  roomId: Joi.string().optional(),
  
  // Performance Metrics
  wpm: Joi.number().min(0).max(300).required(),
  accuracy: Joi.number().min(0).max(100).required(),
  duration: Joi.number().min(1).required(), // in seconds
  wordsTyped: Joi.number().min(0).required(),
  errorsCount: Joi.number().min(0).required(),
  
  // Detailed Analysis
  keystrokeData: Joi.object({
    totalKeystrokes: Joi.number().min(0).required(),
    correctKeystrokes: Joi.number().min(0).required(),
    backspaces: Joi.number().min(0).required(),
    averageSpeed: Joi.number().min(0).required()
  }).required(),
  
  // Content Information
  content: Joi.object({
    topic: Joi.string().required(),
    difficulty: Joi.string().required(),
    textLength: Joi.number().min(1).required()
  }).required(),
  
  // Error Analysis (optional)
  commonErrors: Joi.array().items(
    Joi.object({
      character: Joi.string().required(),
      count: Joi.number().min(1).required(),
      positions: Joi.array().items(Joi.number().min(0)).required()
    })
  ).optional()
});

// POST /api/typing-results/save - Save typing test results
router.post('/save', async (req, res) => {
  try {
    console.log('📊 Saving typing results:', req.body);
    
    // Validate request body
    const { error, value } = typingResultSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Handle different user types (students vs regular users)
    let userData = {};
    let userName = '';
    let userEmail = '';
    let userType = '';

    if (value.userId.startsWith('student_')) {
      // For students, get data from room
      if (!value.roomId) {
        return res.status(400).json({
          error: 'Room ID required for student typing results'
        });
      }

      // Find the room
      const roomSnapshot = await db.collection('rooms')
        .where('roomCode', '==', value.roomId.toUpperCase())
        .get();

      if (roomSnapshot.empty) {
        return res.status(404).json({
          error: 'Room not found'
        });
      }

      const roomData = roomSnapshot.docs[0].data();
      const student = roomData.studentsJoined?.find(s => s.studentId === value.userId);

      if (!student) {
        return res.status(404).json({
          error: 'Student not found in room'
        });
      }

      userName = student.studentName;
      userEmail = student.email || '';
      userType = 'student';
    } else {
      // For regular users, get data from users collection
      const userDoc = await db.collection('users').doc(value.userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      userData = userDoc.data();
      userName = userData.name;
      userEmail = userData.email;
      userType = userData.userType;
    }
    
    // Create typing result document
    const resultData = {
      ...value,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userType: userType,
      userName: userName,
      userEmail: userEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to typingResults collection
    const resultRef = await db.collection('typingResults').add(resultData);
    
    console.log('✅ Typing result saved successfully:', resultRef.id);

    res.status(201).json({
      success: true,
      message: 'Typing result saved successfully',
      data: {
        resultId: resultRef.id,
        userId: value.userId,
        sessionType: value.sessionType,
        wpm: value.wpm,
        accuracy: value.accuracy,
        duration: value.duration
      }
    });

  } catch (error) {
    console.error('❌ Error saving typing result:', error);
    res.status(500).json({
      error: 'Failed to save typing result',
      message: error.message
    });
  }
});

// GET /api/typing-results/user/:userId - Get typing results for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, sessionType } = req.query;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    let query = db.collection('typingResults')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (sessionType) {
      query = query.where('sessionType', '==', sessionType);
    }

    const snapshot = await query.get();
    
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null
      };
    });

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error fetching typing results:', error);
    res.status(500).json({
      error: 'Failed to fetch typing results',
      message: error.message
    });
  }
});

// GET /api/typing-results/user/:userId/stats - Get user typing statistics
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionType, days = 30 } = req.query;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let query = db.collection('typingResults')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);

    if (sessionType) {
      query = query.where('sessionType', '==', sessionType);
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        data: {
          totalSessions: 0,
          averageWPM: 0,
          averageAccuracy: 0,
          bestWPM: 0,
          bestAccuracy: 0,
          totalTimeSpent: 0,
          improvementTrend: 'no-data'
        }
      });
    }

    const results = snapshot.docs.map(doc => doc.data());
    
    // Calculate statistics
    const totalSessions = results.length;
    const averageWPM = Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / totalSessions);
    const averageAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / totalSessions);
    const bestWPM = Math.max(...results.map(r => r.wpm));
    const bestAccuracy = Math.max(...results.map(r => r.accuracy));
    const totalTimeSpent = Math.round(results.reduce((sum, r) => sum + r.duration, 0));

    // Calculate improvement trend (compare first half vs second half)
    const midPoint = Math.floor(totalSessions / 2);
    const firstHalf = results.slice(-totalSessions, -midPoint);
    const secondHalf = results.slice(-midPoint);
    
    let improvementTrend = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstHalfAvgWPM = firstHalf.reduce((sum, r) => sum + r.wpm, 0) / firstHalf.length;
      const secondHalfAvgWPM = secondHalf.reduce((sum, r) => sum + r.wpm, 0) / secondHalf.length;
      
      if (secondHalfAvgWPM > firstHalfAvgWPM + 2) {
        improvementTrend = 'improving';
      } else if (secondHalfAvgWPM < firstHalfAvgWPM - 2) {
        improvementTrend = 'declining';
      }
    }

    res.json({
      success: true,
      data: {
        totalSessions,
        averageWPM,
        averageAccuracy,
        bestWPM,
        bestAccuracy,
        totalTimeSpent,
        improvementTrend,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching typing statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch typing statistics',
      message: error.message
    });
  }
});

// GET /api/typing-results/email/:email - Get typing results for a user by email (for room sessions)
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 10, sessionType } = req.query;

    let query = db.collection('typingResults')
      .where('userEmail', '==', email)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (sessionType) {
      query = query.where('sessionType', '==', sessionType);
    }

    const snapshot = await query.get();
    
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      };
    });

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error fetching typing results by email:', error);
    res.status(500).json({
      error: 'Failed to fetch typing results',
      message: error.message
    });
  }
});

module.exports = router;