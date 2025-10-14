const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

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
  institution: Joi.string().optional().min(2).max(200),
  department: Joi.string().optional().max(100),
  employeeId: Joi.string().optional().max(50),
  phone: Joi.string().optional().pattern(/^[+]?[\d\s\-()]+$/).max(20),
  isActive: Joi.boolean().optional()
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

    // Set default password
    const tempPassword = 'teacher123'; // Default password as requested

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
      tempPassword, // Store temporarily for initial setup
      passwordChanged: false,
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
      tempPassword, // Include for admin to share with teacher
      isActive: true,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully',
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