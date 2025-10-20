const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const mistralService = require('../services/mistralService');

const db = admin.firestore();

// Generate patient response using Mistral 7B
router.post('/generate-response', async (req, res) => {
  try {
    const { message, patientContext, conversationHistory } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if Mistral service is configured
    if (!mistralService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Mistral API is not configured. Please check your API key.'
      });
    }

    // Generate response using Mistral
    const patientResponse = await mistralService.generatePatientResponse(
      message,
      patientContext || {},
      conversationHistory || []
    );

    res.json({
      success: true,
      response: patientResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating patient response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate patient response',
      error: error.message
    });
  }
});



// Generate response and use browser speech synthesis
router.post('/chat-with-speech', async (req, res) => {
  const startTime = Date.now();
  const requestId = req.body.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const studentId = req.headers['x-student-id'] || req.body.patientContext?.studentId || 'unknown';
  const roomCode = req.headers['x-room-code'] || req.body.patientContext?.roomCode || 'unknown';
  
  try {
    const { message, patientContext, conversationHistory, includeAudio } = req.body;

    console.log(`[${requestId}] Chat request from student ${studentId} in room ${roomCode}`);

    // Validate required fields
    if (!message) {
      console.log(`[${requestId}] Missing message field`);
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        requestId: requestId
      });
    }

    // Check if services are configured
    if (!mistralService.isConfigured()) {
      console.log(`[${requestId}] Mistral service not configured`);
      return res.status(500).json({
        success: false,
        message: 'Mistral API is not configured. Please check your API key.',
        requestId: requestId
      });
    }

    // Add rate limiting protection
    const now = Date.now();
    if (!global.lastRequestTime) global.lastRequestTime = {};
    if (!global.requestCounts) global.requestCounts = {};
    
    const userKey = `${studentId}_${roomCode}`;
    const lastRequest = global.lastRequestTime[userKey] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    // Allow max 1 request per second per user
    if (timeSinceLastRequest < 1000) {
      console.log(`[${requestId}] Rate limit exceeded for ${userKey}, ${timeSinceLastRequest}ms since last request`);
      return res.status(429).json({
        success: false,
        message: 'Please wait a moment before sending another message.',
        requestId: requestId,
        retryAfter: 1000 - timeSinceLastRequest
      });
    }
    
    global.lastRequestTime[userKey] = now;

    console.log(`[${requestId}] Processing AI request for message: "${message.substring(0, 50)}..."`);

    // Enhance patient context with room and student info for consistent patient identity
    const enhancedPatientContext = {
      ...(patientContext || {}),
      roomCode: roomCode,
      studentId: studentId
    };

    // Generate text response
    const patientResponse = await mistralService.generatePatientResponse(
      message,
      enhancedPatientContext,
      conversationHistory || []
    );

    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] AI response generated in ${processingTime}ms`);

    const result = {
      success: true,
      response: patientResponse,
      timestamp: new Date().toISOString(),
      useBrowserSpeech: true, // Always use browser speech synthesis
      requestId: requestId,
      processingTime: processingTime
    };

    res.json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Error in chat with speech (${processingTime}ms):`, error.message);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to process chat request';
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      statusCode = 429;
      errorMessage = 'AI service is busy. Please try again in a moment.';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Request timed out. Please try again.';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      requestId: requestId,
      processingTime: processingTime
    });
  }
});

// Initialize AI Patient room (no automatic patient generation)
router.post('/generate-patient', async (req, res) => {
  try {
    const { seed, roomCode, studentId } = req.body;

    // Validate required fields
    if (!seed || !roomCode || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Seed, roomCode, and studentId are required'
      });
    }

    console.log(`AI Patient room initialized - Seed: ${seed}, Student: ${studentId}`);

    // Return minimal response - students must discover all patient info through conversation
    res.json({
      success: true,
      message: 'AI Patient room initialized. Start by greeting the patient and asking questions to gather information.',
      roomCode: roomCode,
      studentId: studentId,
      timestamp: new Date().toISOString(),
      instructions: 'Ask the AI patient questions to gather their personal and medical information, then manually fill out the consultation form.'
    });

  } catch (error) {
    console.error('Error initializing AI patient room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize AI patient room.',
      error: error.message
    });
  }
});

// Submit AI Patient assessment to teacher
router.post('/submit-assessment', async (req, res) => {
  try {
    const { 
      roomCode, 
      studentId, 
      studentName, 
      patientData, 
      consultationData, 
      conversationHistory,
      submissionTime 
    } = req.body;

    // Validate required fields
    if (!roomCode || !studentId || !studentName || !consultationData) {
      return res.status(400).json({
        success: false,
        message: 'RoomCode, studentId, studentName, and consultationData are required'
      });
    }

    // Create assessment submission object
    const assessment = {
      submissionId: `${roomCode}-${studentId}-${Date.now()}`,
      roomCode,
      studentId,
      studentName,
      patientData: patientData || {},
      consultationData,
      conversationHistory: conversationHistory || [],
      submissionTime: submissionTime || new Date().toISOString(),
      status: 'submitted',
      teacherFeedback: null,
      score: null
    };

    // Save consultation data to consultations collection for teacher retrieval
    const consultationPayload = {
      userId: studentId, // This is the key field that teachers query by
      patientName: consultationData.patientName || patientData?.name || 'Unknown Patient',
      patientData: {
        name: consultationData.patientName || patientData?.name || '',
        dateOfBirth: consultationData.dateOfBirth || patientData?.dateOfBirth || '',
        gender: consultationData.gender || patientData?.gender || '',
        occupation: consultationData.occupation || patientData?.occupation || '',
        address: consultationData.address || ''
      },
      findings: {
        chiefComplaint: consultationData.chiefComplaint || '',
        presentIllness: consultationData.presentIllness || '',
        pastIllness: consultationData.pastIllness || '',
        allergies: consultationData.allergies || '',
        medications: consultationData.medications || '',
        previousSurgeries: consultationData.previousSurgeries || ''
      },
      recommendations: {
        treatmentPlan: consultationData.treatmentPlan || '',
        followUpInstructions: consultationData.followUpInstructions || '',
        additionalNotes: consultationData.additionalNotes || ''
      },
      // Additional AI Patient specific data
      roomCode,
      studentName,
      conversationHistory: conversationHistory || [],
      submissionType: 'ai_patient_assessment',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to consultations collection
    const consultationRef = await db.collection('consultations').add(consultationPayload);

    console.log('AI Patient Assessment Submitted:', {
      submissionId: assessment.submissionId,
      consultationId: consultationRef.id,
      roomCode: assessment.roomCode,
      studentId: studentId,
      studentName: assessment.studentName,
      patientName: assessment.patientData.name,
      submissionTime: assessment.submissionTime
    });

    res.json({
      success: true,
      message: 'Assessment submitted successfully to teacher',
      submissionId: assessment.submissionId,
      consultationId: consultationRef.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting AI Patient assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment',
      error: error.message
    });
  }
});

// Get API status and configuration
router.get('/status', async (req, res) => {
  try {
    const status = {
      mistral: {
        configured: mistralService.isConfigured(),
        status: mistralService.isConfigured() ? 'ready' : 'not configured'
      },
      speech: {
        type: 'browser_synthesis',
        status: 'ready'
      }
    };

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;