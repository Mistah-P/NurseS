const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const router = express.Router();
const db = admin.firestore();

// Validation schemas
const createTeacherSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  adminId: Joi.string().required() // ID of the admin creating this teacher
});

const updateTeacherSchema = Joi.object({
  name: Joi.string().optional().min(2).max(100),
  email: Joi.string().email().optional(),
  institution: Joi.string().optional().min(2).max(200),
  department: Joi.string().optional().max(100),
  employeeId: Joi.string().optional().max(50),
  phone: Joi.string().optional().pattern(/^[+]?[\d\s\-()]+$/).max(20),
  isActive: Joi.boolean().optional(),
  adminId: Joi.string().optional() // Admin ID for authorization
});

// Middleware to verify admin access
const verifyAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.body;
    if (!adminId) {
      return res.status(401).json({
        error: 'Admin ID required',
        message: 'Admin authentication required'
      });
    }

    // Check if user is admin
    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists) {
      return res.status(401).json({
        error: 'Admin not found',
        message: 'Invalid admin credentials'
      });
    }

    const adminData = adminDoc.data();
    if (adminData.userType !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    req.admin = adminData;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

// POST /api/admin/teachers - Create new teacher account
router.post('/teachers', verifyAdmin, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createTeacherSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, email, adminId } = value;

    // Check if teacher email already exists
    const existingTeacher = await db.collection('teachers')
      .where('email', '==', email)
      .get();

    if (!existingTeacher.empty) {
      return res.status(409).json({
        error: 'Teacher already exists',
        message: 'A teacher with this email already exists'
      });
    }

    // Generate random temporary password (8-12 characters, secure)
    const generateRandomPassword = () => {
      const length = Math.floor(Math.random() * 5) + 8; // 8-12 characters
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      
      // Ensure at least one of each type
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
      password += '0123456789'[Math.floor(Math.random() * 10)]; // number
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
      
      // Fill the rest randomly
      for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const tempPassword = generateRandomPassword();
    console.log(`🔐 Generated temporary password for ${email}: ${tempPassword}`);

    // Create Firebase Auth account for the teacher
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: tempPassword,
        displayName: name,
        emailVerified: true // Auto-verify since admin is creating this
      });
      console.log(`✅ Firebase Auth user created for teacher: ${email}`);
    } catch (authError) {
      console.error('Error creating Firebase Auth user:', authError);
      return res.status(500).json({
        error: 'Failed to create authentication account',
        message: 'Could not create Firebase Auth account for teacher'
      });
    }

    // Send password reset email with temporary password info
    let emailSent = false;
    let emailError = null;
    
    try {
      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: 'https://nursescript.uic.edu.ph/login', // Your app's login URL
        handleCodeInApp: false
      });

      console.log(`📧 Password reset link generated for ${email}`);
      console.log(`🔗 Reset link: ${resetLink}`);
      
      // Send actual email using our email service
      const emailResult = await emailService.sendTeacherPasswordResetEmail(
        email,
        name,
        resetLink,
        tempPassword
      );
      
      if (emailResult.success) {
        emailSent = true;
        console.log(`✅ Password reset email sent successfully to ${email}`);
      }
      
    } catch (error) {
      console.error('Error sending password reset email:', error);
      emailError = error.message;
      // Don't fail the entire operation if email fails
      console.warn(`⚠️ Teacher account created but email notification failed for ${email}: ${error.message}`);
    }

    // Use Firebase UID as teacherId for consistency
    const teacherId = firebaseUser.uid;

    // Create teacher data with minimal required fields
    const teacherData = {
      id: teacherId,
      firebaseUid: firebaseUser.uid, // Same as id for consistency
      name,
      email,
      institution: null, // Can be updated later in teacher settings
      department: null,
      employeeId: null,
      phone: null,
      userType: 'teacher',
      isActive: true,
      passwordChanged: false, // Will be true after they reset their password
      emailSent: emailSent, // Whether password reset email was sent successfully
      emailError: emailError, // Any email error that occurred
      createdBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      teacherData: {
        institution: null,
        activeRooms: [],
        totalStudents: 0,
        totalRooms: 0
      }
    };

    // Save to Firestore teachers collection using Firebase UID as document ID
    await db.collection('teachers').doc(teacherId).set(teacherData);

    console.log(`✅ Teacher created: ${email} by admin ${adminId}`);

    // Return response without sensitive data
    const responseData = {
      id: teacherId,
      name,
      email,
      institution: null,
      department: null,
      employeeId: null,
      phone: null,
      emailSent: emailSent, // Actual email sending status
      emailError: emailError, // Any email error for debugging
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const successMessage = emailSent 
      ? `Teacher account created successfully. Password reset email sent to ${email}.`
      : `Teacher account created successfully, but email notification failed. Please manually send password reset instructions to ${email}.`;

    res.status(201).json({
      success: true,
      message: successMessage,
      data: responseData
    });

  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({
      error: 'Failed to create teacher',
      message: error.message
    });
  }
});

// GET /api/admin/teachers - Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    const { adminId, status } = req.query;

    // Verify admin access
    if (!adminId) {
      return res.status(401).json({
        error: 'Admin ID required'
      });
    }

    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().userType !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    let query = db.collection('teachers');

    if (status) {
      query = query.where('isActive', '==', status === 'active');
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const teachers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        institution: data.institution,
        department: data.department,
        employeeId: data.employeeId,
        phone: data.phone,
        isActive: data.isActive,
        passwordChanged: data.passwordChanged,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        totalRooms: data.teacherData?.totalRooms || 0,
        totalStudents: data.teacherData?.totalStudents || 0
      };
    });

    res.json({
      success: true,
      data: teachers,
      count: teachers.length
    });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      error: 'Failed to fetch teachers',
      message: error.message
    });
  }
});

// GET /api/admin/teachers/:teacherId - Get specific teacher
router.get('/teachers/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { adminId } = req.query;

    // Verify admin access
    if (!adminId) {
      return res.status(401).json({
        error: 'Admin ID required'
      });
    }

    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().userType !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        error: 'Teacher not found'
      });
    }

    const data = teacherDoc.data();
    const responseData = {
      id: data.id,
      name: data.name,
      email: data.email,
      institution: data.institution,
      department: data.department,
      employeeId: data.employeeId,
      phone: data.phone,
      isActive: data.isActive,
      passwordChanged: data.passwordChanged,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      teacherData: data.teacherData
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({
      error: 'Failed to fetch teacher',
      message: error.message
    });
  }
});

// PUT /api/admin/teachers/:teacherId - Update teacher
router.put('/teachers/:teacherId', verifyAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Validate request body
    const { error, value } = updateTeacherSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        error: 'Teacher not found'
      });
    }

    // Update teacher data
    const updateData = {
      ...value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await teacherDoc.ref.update(updateData);

    res.json({
      success: true,
      message: 'Teacher updated successfully'
    });

  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({
      error: 'Failed to update teacher',
      message: error.message
    });
  }
});

// DELETE /api/admin/teachers/:teacherId - Deactivate teacher
router.delete('/teachers/:teacherId', verifyAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        error: 'Teacher not found'
      });
    }

    // Deactivate instead of delete to maintain data integrity
    await teacherDoc.ref.update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating teacher:', error);
    res.status(500).json({
      error: 'Failed to deactivate teacher',
      message: error.message
    });
  }
});

// DELETE /api/admin/teachers/:teacherId/permanent - Permanently delete teacher
router.delete('/teachers/:teacherId/permanent', verifyAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { adminId } = req.body;

    console.log(`🗑️ Admin ${adminId} attempting to permanently delete teacher ${teacherId}`);

    // Verify admin permissions
    if (!adminId) {
      return res.status(401).json({
        error: 'Admin ID required for permanent deletion'
      });
    }

    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().userType !== 'admin') {
      return res.status(403).json({
        error: 'Access denied - Admin privileges required'
      });
    }

    // Check if teacher exists
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        error: 'Teacher not found'
      });
    }

    const teacherData = teacherDoc.data();

    // Safety check: Require teacher to be deactivated first
    if (teacherData.isActive) {
      return res.status(400).json({
        error: 'Teacher must be deactivated before permanent deletion',
        message: 'Please deactivate the teacher first, then proceed with permanent deletion'
      });
    }

    // Use Firestore transaction for data consistency
    await db.runTransaction(async (transaction) => {
      // READS FIRST: Get all documents that need to be checked/updated
      const teacherPrefsRef = db.collection('teacherPreferences').doc(teacherId);
      const teacherPrefsDoc = await transaction.get(teacherPrefsRef);

      // Get sessions to delete
      const sessionsQuery = await db.collection('sessions')
        .where('userId', '==', teacherId)
        .get();

      // Get rooms to update
      const roomsQuery = await db.collection('rooms')
        .where('teacherId', '==', teacherId)
        .get();

      // WRITES SECOND: Perform all deletions and updates
      // 1. Delete from teachers collection
      transaction.delete(db.collection('teachers').doc(teacherId));

      // 2. Delete teacher preferences if they exist
      if (teacherPrefsDoc.exists) {
        transaction.delete(teacherPrefsRef);
      }

      // 3. Delete teacher sessions
      sessionsQuery.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });

      // 4. Update rooms created by this teacher (set teacherId to null to avoid orphaning)
      roomsQuery.docs.forEach(doc => {
        transaction.update(doc.ref, {
          teacherId: null,
          teacherDeleted: true,
          teacherDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    });

    // 5. Delete from Firebase Auth (outside transaction as it's not Firestore)
    try {
      await admin.auth().deleteUser(teacherId);
      console.log(`✅ Firebase Auth user deleted: ${teacherId}`);
    } catch (authError) {
      console.warn(`⚠️ Could not delete Firebase Auth user ${teacherId}:`, authError.message);
      // Continue with success as Firestore data is already deleted
    }

    console.log(`✅ Teacher permanently deleted: ${teacherData.email} by admin ${adminId}`);

    res.json({
      success: true,
      message: 'Teacher permanently deleted successfully',
      deletedTeacher: {
        id: teacherId,
        name: teacherData.name,
        email: teacherData.email
      }
    });

  } catch (error) {
    console.error('Error permanently deleting teacher:', error);
    res.status(500).json({
      error: 'Failed to permanently delete teacher',
      message: error.message
    });
  }
});

// Teacher self-profile GET endpoint (no admin verification required)
router.get('/teachers/:teacherId/profile', async (req, res) => {
  try {
    const { teacherId } = req.params;

    // First try to find teacher by document ID (Firebase UID)
    let teacherRef = db.collection('teachers').doc(teacherId);
    let teacherDoc = await teacherRef.get();

    // If not found by document ID, try to find by firebaseUid field (for backward compatibility)
    if (!teacherDoc.exists) {
      const teachersQuery = await db.collection('teachers').where('firebaseUid', '==', teacherId).get();
      if (!teachersQuery.empty) {
        teacherDoc = teachersQuery.docs[0];
      }
    }

    if (!teacherDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found',
        message: 'Teacher with this ID does not exist'
      });
    }

    const data = teacherDoc.data();
    
    // Return teacher profile data (excluding sensitive information)
    const responseData = {
      id: data.id,
      name: data.name,
      email: data.email,
      institution: data.institution,
      department: data.department,
      employeeId: data.employeeId,
      phone: data.phone,
      isActive: data.isActive,
      passwordChanged: data.passwordChanged,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      teacherData: data.teacherData
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch teacher profile'
    });
  }
});

// Teacher self-update endpoint (no admin verification required)
router.put('/teachers/:teacherId/profile', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const updates = req.body;

    // Validate input
    const { error } = updateTeacherSchema.validate(updates);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // First try to find teacher by document ID (Firebase UID)
    let teacherRef = db.collection('teachers').doc(teacherId);
    let teacherDoc = await teacherRef.get();

    // If not found by document ID, try to find by firebaseUid field (for backward compatibility)
    if (!teacherDoc.exists) {
      const teachersQuery = await db.collection('teachers').where('firebaseUid', '==', teacherId).get();
      if (!teachersQuery.empty) {
        teacherDoc = teachersQuery.docs[0];
        teacherRef = teacherDoc.ref; // Update reference to the found document
      }
    }

    if (!teacherDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found',
        message: 'Teacher with this ID does not exist'
      });
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update teacher document
    await teacherRef.update(updateData);

    // Fetch updated data
    const updatedDoc = await teacherRef.get();
    const data = updatedDoc.data();

    // Return updated teacher profile data (excluding sensitive information)
    const responseData = {
      id: data.id,
      name: data.name,
      email: data.email,
      institution: data.institution,
      department: data.department,
      employeeId: data.employeeId,
      phone: data.phone,
      isActive: data.isActive,
      passwordChanged: data.passwordChanged,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      teacherData: data.teacherData
    };

    res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update teacher profile'
    });
  }
});

module.exports = router;