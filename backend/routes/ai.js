const express = require('express');
const router = express.Router();
const mistralService = require('../services/mistralService');

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
  try {
    const { message, patientContext, conversationHistory, includeAudio } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if services are configured
    if (!mistralService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Mistral API is not configured. Please check your API key.'
      });
    }

    // Generate text response
    const patientResponse = await mistralService.generatePatientResponse(
      message,
      patientContext || {},
      conversationHistory || []
    );

    const result = {
      success: true,
      response: patientResponse,
      timestamp: new Date().toISOString(),
      useBrowserSpeech: true // Always use browser speech synthesis
    };

    res.json(result);

  } catch (error) {
    console.error('Error in chat with speech:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat request',
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