const admin = require('firebase-admin');

/**
 * Authentication middleware to verify Firebase tokens
 * Extracts teacher information from the token and adds it to req.teacher
 */
const verifyTeacherAuth = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authorization token format'
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Get teacher information from Firestore
    const db = admin.firestore();
    
    // First try to find teacher by document ID (Firebase UID)
    let teacherRef = db.collection('teachers').doc(decodedToken.uid);
    let teacherDoc = await teacherRef.get();

    // If not found by document ID, try to find by firebaseUid field (for backward compatibility)
    if (!teacherDoc.exists) {
      const teachersQuery = await db.collection('teachers')
        .where('firebaseUid', '==', decodedToken.uid)
        .get();
      
      if (!teachersQuery.empty) {
        teacherDoc = teachersQuery.docs[0];
      }
    }

    // If still not found, try to find by email (additional fallback)
    if (!teacherDoc.exists && decodedToken.email) {
      const teachersQuery = await db.collection('teachers')
        .where('email', '==', decodedToken.email)
        .get();
      
      if (!teachersQuery.empty) {
        teacherDoc = teachersQuery.docs[0];
      }
    }

    if (!teacherDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Teacher account not found'
      });
    }

    const teacherData = teacherDoc.data();
    
    // Check if teacher account is active
    if (!teacherData.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Teacher account is deactivated'
      });
    }

    // Add teacher information to request object
    req.teacher = {
      id: teacherData.id || teacherDoc.id,
      firebaseUid: decodedToken.uid,
      email: teacherData.email || decodedToken.email,
      name: teacherData.name,
      institution: teacherData.institution,
      department: teacherData.department
    };

    // Continue to the next middleware/route handler
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token Expired',
        message: 'Authentication token has expired'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token Revoked',
        message: 'Authentication token has been revoked'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication Failed',
      message: 'Failed to authenticate request'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that can work with or without authentication
 */
const optionalTeacherAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.teacher = null;
      return next();
    }

    // If token is provided, verify it using the same logic
    await verifyTeacherAuth(req, res, next);
  } catch (error) {
    // If authentication fails but was optional, continue without auth
    req.teacher = null;
    next();
  }
};

module.exports = {
  verifyTeacherAuth,
  optionalTeacherAuth
};