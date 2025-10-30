const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');

const router = express.Router();
const db = admin.firestore();
const { verifyTeacherAuth } = require('../middleware/auth');

// Get teacher's student list
router.get('/students', verifyTeacherAuth, async (req, res) => {
  try {
    const teacherId = req.teacher.firebaseUid;
    
    // Get teacher document
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const teacherData = teacherDoc.data();
    const studentIds = teacherData.students || [];

    if (studentIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get student details
    const studentPromises = studentIds.map(async (studentId) => {
      try {
        const studentDoc = await db.collection('users').doc(studentId).get();
        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          return {
            id: studentDoc.id,
            name: studentData.name || 'Unknown',
            email: studentData.email || '',
            stats: {
              totalTests: studentData.totalTests || 0,
              averageWPM: studentData.averageWPM || 0,
              lastActive: studentData.lastActive || null
            }
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error);
        return null;
      }
    });

    const students = (await Promise.all(studentPromises)).filter(student => student !== null);

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search for students to add to class
router.get('/search-students', verifyTeacherAuth, async (req, res) => {
  try {
    const { q: searchTerm, limit: maxResults = 10 } = req.query;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    const students = [];
    
    // Get all users - we'll filter for students in the logic below
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name || '';
      const email = data.email || '';
      
      // Only include users that are students (either explicitly marked or legacy accounts)
      // Legacy student accounts don't have userType, but they also don't have teacher-specific fields
      const isStudent = data.userType === 'student' || 
                       (!data.userType && !data.isActive && !data.adminLevel && name && email);
      
      // Check if this is a student and if name or email contains the search term
      if (isStudent && (name.toLowerCase().includes(normalizedTerm) || 
          email.toLowerCase().includes(normalizedTerm))) {
        students.push({
          id: doc.id,
          name: name,
          email: email,
          userType: data.userType || 'student', // Default to 'student' for legacy accounts
          stats: data.stats || {},
          createdAt: data.createdAt
        });
      }
    });

    // Sort by name and limit results
    const sortedStudents = students
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, parseInt(maxResults));

    res.json({
      success: true,
      data: sortedStudents
    });

  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search students'
    });
  }
});

// Add students to teacher's class
router.post('/add-students', verifyTeacherAuth, async (req, res) => {
  try {
    const teacherId = req.teacher.firebaseUid;
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Students array is required'
      });
    }

    // Validate student data
    for (const student of students) {
      if (!student.id || !student.name || !student.email) {
        return res.status(400).json({
          success: false,
          message: 'Each student must have id, name, and email'
        });
      }
    }

    // Get current teacher data
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const teacherData = teacherDoc.data();
    const currentStudents = teacherData.students || [];
    const newStudentIds = students.map(s => s.id);

    // Filter out students that are already in the list
    const studentsToAdd = newStudentIds.filter(id => !currentStudents.includes(id));
    
    if (studentsToAdd.length === 0) {
      return res.json({
        success: true,
        message: 'All selected students are already in your class',
        data: []
      });
    }

    // Update teacher document with new students
    const updatedStudents = [...currentStudents, ...studentsToAdd];
    
    await db.collection('teachers').doc(teacherId).update({
      students: updatedStudents,
      updatedAt: new Date()
    });

    // Update each student's document to include this teacher
    const updatePromises = studentsToAdd.map(async (studentId) => {
      try {
        const studentDoc = await db.collection('users').doc(studentId).get();
        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          const currentTeachers = studentData.teachers || [];
          
          if (!currentTeachers.includes(teacherId)) {
            await db.collection('users').doc(studentId).update({
              teachers: [...currentTeachers, teacherId],
              updatedAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error(`Error updating student ${studentId}:`, error);
      }
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Successfully added ${studentsToAdd.length} student${studentsToAdd.length !== 1 ? 's' : ''} to your class`,
      data: studentsToAdd
    });

  } catch (error) {
    console.error('Error adding students to teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove student from teacher's class
router.delete('/students/:studentId', verifyTeacherAuth, async (req, res) => {
  try {
    const teacherId = req.teacher.firebaseUid;
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Get current teacher data
    const teacherDoc = await db.collection('teachers').doc(teacherId).get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const teacherData = teacherDoc.data();
    const currentStudents = teacherData.students || [];

    if (!currentStudents.includes(studentId)) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your class'
      });
    }

    // Remove student from teacher's list
    const updatedStudents = currentStudents.filter(id => id !== studentId);
    
    await db.collection('teachers').doc(teacherId).update({
      students: updatedStudents,
      updatedAt: new Date()
    });

    // Remove teacher from student's list
    try {
      const studentDoc = await db.collection('users').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        const currentTeachers = studentData.teachers || [];
        const updatedTeachers = currentTeachers.filter(id => id !== teacherId);
        
        await db.collection('users').doc(studentId).update({
          teachers: updatedTeachers,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Error updating student ${studentId}:`, error);
      // Continue even if student update fails
    }

    res.json({
      success: true,
      message: 'Student removed successfully'
    });

  } catch (error) {
    console.error('Error removing student from teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;