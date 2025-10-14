const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');

const router = express.Router();
const db = admin.firestore();

// Validation schemas
const joinRoomSchema = Joi.object({
  roomCode: Joi.string().required().length(6),
  studentId: Joi.string().required(),
  studentName: Joi.string().required().min(1).max(100),
  email: Joi.string().email().allow(null).optional(),
  yearLevel: Joi.string().allow(null).optional(),
  section: Joi.string().allow(null).optional()
});

// POST /api/students/join-room - Student joins a room
router.post('/join-room', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = joinRoomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { roomCode, studentId, studentName, email, yearLevel, section } = value;

    // Find the room
    const roomSnapshot = await db.collection('rooms')
      .where('roomCode', '==', roomCode.toUpperCase())
      .get();

    if (roomSnapshot.empty) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'No room exists with this code'
      });
    }

    const roomDoc = roomSnapshot.docs[0];
    const roomData = roomDoc.data();

    // Check if room is still accepting students
    if (roomData.status === 'completed') {
      return res.status(400).json({
        error: 'Room closed',
        message: 'This room has already been completed'
      });
    }

    // Check if student is already in the room
    const existingStudent = roomData.studentsJoined?.find(
      student => student.studentId === studentId
    );

    if (existingStudent) {
      // Instead of returning an error, return the existing student data
      // This allows seamless rejoining without duplicates
      console.log(`🔄 Student rejoining room: ${studentName} -> ${roomCode}`);
      
      return res.json({
        success: true,
        message: 'Welcome back to the room',
        data: {
          roomCode,
          roomId: roomData.id,
          activityName: roomData.activityName,
          mode: roomData.mode,
          duration: roomData.duration,
          module: roomData.module,
          difficultyLevel: roomData.difficultyLevel,
          student: {
            studentId: existingStudent.studentId,
            studentName: existingStudent.studentName,
            status: existingStudent.status
          }
        }
      });
    }

    // Create student data
    const studentData = {
      studentId,
      studentName,
      email: email || null,
      yearLevel: yearLevel || null,
      section: section || null,
      joinedAt: new Date().toISOString(),
      status: 'ready', // ready, active, completed
      wpm: 0,
      accuracy: 0,
      progress: 0
    };

    // Add student to room
    await roomDoc.ref.update({
      studentsJoined: admin.firestore.FieldValue.arrayUnion(studentData),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`👨‍🎓 Student joined room: ${studentName} -> ${roomCode}`);

    res.json({
      success: true,
      message: 'Successfully joined the room',
      data: {
        roomCode,
        roomId: roomData.id,
        activityName: roomData.activityName,
        mode: roomData.mode,
        duration: roomData.duration,
        module: roomData.module,
        difficultyLevel: roomData.difficultyLevel,
        student: {
          studentId,
          studentName,
          status: 'ready'
        }
      }
    });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      error: 'Failed to join room',
      message: error.message
    });
  }
});

// PUT /api/students/:studentId/progress - Update student progress
router.put('/:studentId/progress', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { roomCode, wpm, accuracy, progress, status } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Room code is required'
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

    // Find and update student data
    const studentsJoined = roomData.studentsJoined || [];
    const studentIndex = studentsJoined.findIndex(
      student => student.studentId === studentId
    );

    if (studentIndex === -1) {
      return res.status(404).json({
        error: 'Student not found in this room'
      });
    }

    // Update student data
    const updatedStudent = {
      ...studentsJoined[studentIndex],
      wpm: wpm !== undefined ? wpm : studentsJoined[studentIndex].wpm,
      accuracy: accuracy !== undefined ? accuracy : studentsJoined[studentIndex].accuracy,
      progress: progress !== undefined ? progress : studentsJoined[studentIndex].progress,
      status: status || studentsJoined[studentIndex].status,
      lastUpdated: new Date().toISOString()
    };

    studentsJoined[studentIndex] = updatedStudent;

    // Update room with new student data
    await roomDoc.ref.update({
      studentsJoined,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Student progress updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Error updating student progress:', error);
    res.status(500).json({
      error: 'Failed to update student progress',
      message: error.message
    });
  }
});

// DELETE /api/students/:studentId/leave-room - Student leaves a room
router.delete('/:studentId/leave-room', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: 'Room code is required'
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

    // Find student to remove
    const studentsJoined = roomData.studentsJoined || [];
    const studentToRemove = studentsJoined.find(
      student => student.studentId === studentId
    );

    if (!studentToRemove) {
      return res.status(404).json({
        error: 'Student not found in this room'
      });
    }

    // Remove student from room
    const updatedStudents = studentsJoined.filter(
      student => student.studentId !== studentId
    );

    await roomDoc.ref.update({
      studentsJoined: updatedStudents,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`👋 Student left room: ${studentToRemove.studentName} <- ${roomCode}`);

    res.json({
      success: true,
      message: 'Successfully left the room'
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      error: 'Failed to leave room',
      message: error.message
    });
  }
});

// GET /api/students/room/:roomCode - Get all students in a room
router.get('/room/:roomCode', async (req, res) => {
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

    const roomData = roomSnapshot.docs[0].data();
    const students = roomData.studentsJoined || [];

    // Convert timestamps to ISO strings
    const studentsWithFormattedDates = students.map(student => ({
      ...student,
      joinedAt: student.joinedAt?.toDate?.()?.toISOString() || null,
      lastUpdated: student.lastUpdated?.toDate?.()?.toISOString() || null
    }));

    res.json({
      success: true,
      data: studentsWithFormattedDates,
      count: studentsWithFormattedDates.length
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      error: 'Failed to fetch students',
      message: error.message
    });
  }
});

module.exports = router;