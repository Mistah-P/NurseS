const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Get Firestore database reference
const db = admin.firestore();

// Save consultation data
router.post('/save', async (req, res) => {
  try {
    const consultationData = req.body;
    
    // Add timestamp and ID
    const consultation = {
      ...consultationData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const docRef = await db.collection('consultations').add(consultation);
    
    res.status(201).json({
      success: true,
      message: 'Consultation saved successfully',
      id: docRef.id
    });
  } catch (error) {
    console.error('Error saving consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save consultation',
      error: error.message
    });
  }
});

// Get consultations for a specific user
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId parameter is required'
      });
    }

    const consultationsRef = db.collection('consultations');
    const snapshot = await consultationsRef
      .where('userId', '==', userId)
      .get();
    
    const consultations = [];
    snapshot.forEach(doc => {
      consultations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt in descending order (newest first)
    consultations.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      consultations: consultations
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations',
      error: error.message
    });
  }
});

// Get specific consultation by ID
router.get('/:id', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { userId } = req.query;
    
    const doc = await db.collection('consultations').doc(consultationId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultationData = doc.data();
    
    // Validate user ownership for privacy
    if (userId && consultationData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own consultations'
      });
    }

    res.status(200).json({
      success: true,
      consultation: {
        id: doc.id,
        ...consultationData
      }
    });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation',
      error: error.message
    });
  }
});

// Get consultation for a specific student (for teachers in AI Patient rooms)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Find the most recent consultation for this student
    const consultationsRef = db.collection('consultations');
    const snapshot = await consultationsRef
      .where('userId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No consultation found for this student'
      });
    }

    const doc = snapshot.docs[0];
    const consultationData = doc.data();

    res.status(200).json({
      success: true,
      consultation: {
        id: doc.id,
        ...consultationData
      }
    });
  } catch (error) {
    console.error('Error fetching student consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student consultation',
      error: error.message
    });
  }
});

// Add or update teacher feedback for a consultation
router.post('/feedback', async (req, res) => {
  try {
    const { studentId, consultationId, feedback } = req.body;
    
    if (!studentId || !consultationId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, consultation ID, and feedback are required'
      });
    }

    // Validate feedback structure
    if (!feedback.content || !feedback.teacherName) {
      return res.status(400).json({
        success: false,
        message: 'Feedback content and teacher name are required'
      });
    }

    // Get the consultation document
    const consultationRef = db.collection('consultations').doc(consultationId);
    const consultationDoc = await consultationRef.get();
    
    if (!consultationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultationData = consultationDoc.data();
    
    // Verify the consultation belongs to the specified student
    if (consultationData.userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Consultation does not belong to the specified student'
      });
    }

    // Update the consultation with teacher feedback
    await consultationRef.update({
      teacherFeedback: {
        content: feedback.content,
        teacherName: feedback.teacherName,
        createdAt: feedback.createdAt || admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
});

module.exports = router;