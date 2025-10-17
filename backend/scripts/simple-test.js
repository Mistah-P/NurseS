const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function simpleTest() {
  try {
    console.log('🧪 Simple test: Creating room and testing typing result...\n');
    
    // Step 1: Create a room
    const roomData = {
      activityName: "Simple Test",
      section: "BSN-1A", 
      yearLevel: "1st",
      mode: "Timed",
      duration: 5,
      wordCount: null,
      module: "Mental Health and Psychiatric Nursing",
      difficultyLevel: "Normal",
      teacherId: "test-teacher-123",
      teacherName: "Test Teacher"
    };
    
    const roomResponse = await axios.post(`${API_BASE_URL}/rooms`, roomData);
    const room = roomResponse.data.data;
    console.log(`✅ Room created: ${room.roomCode} - ${room.module} (${room.difficultyLevel})`);
    
    // Step 2: Add student to room
    const studentData = {
      roomCode: room.roomCode,
      studentId: "student_simple-test",
      studentName: "Simple Test Student",
      email: "simple@test.com",
      section: "BSN-1A",
      yearLevel: "1st"
    };
    
    const joinResponse = await axios.post(`${API_BASE_URL}/students/join-room`, studentData);
    console.log(`✅ Student joined: ${studentData.studentName}`);
    
    // Step 3: Save typing result
    const typingData = {
      userId: studentData.studentId,
      sessionType: "room",
      roomId: room.roomCode,
      wpm: 50,
      accuracy: 85,
      duration: 180,
      wordsTyped: 150,
      errorsCount: 5,
      keystrokeData: {
        totalKeystrokes: 900,
        correctKeystrokes: 765,
        backspaces: 135,
        averageSpeed: 50
      },
      content: {
        topic: "Original Topic",
        difficulty: "Original Difficulty", 
        textLength: 900
      }
    };
    
    console.log('\n📊 Sending typing result with original content:');
    console.log(`   Original Topic: ${typingData.content.topic}`);
    console.log(`   Original Difficulty: ${typingData.content.difficulty}`);
    
    const typingResponse = await axios.post(`${API_BASE_URL}/typing-results/save`, typingData);
    console.log(`✅ Typing result saved: ${typingResponse.data.data.resultId}`);
    
    // Step 4: Check what was actually saved
    console.log('\n🔍 Checking what was saved in the database...');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get recent results to see what was saved
    const recentResponse = await axios.get(`${API_BASE_URL}/typing-results/user/${studentData.studentId}?limit=1`);
    
    if (recentResponse.data.success && recentResponse.data.data.length > 0) {
      const savedResult = recentResponse.data.data[0];
      console.log(`📊 Saved result content:`);
      console.log(`   Saved Topic: ${savedResult.content?.topic}`);
      console.log(`   Saved Difficulty: ${savedResult.content?.difficulty}`);
      console.log(`   Expected Topic: ${room.module}`);
      console.log(`   Expected Difficulty: ${room.difficultyLevel}`);
      
      if (savedResult.content?.topic === room.module && savedResult.content?.difficulty === room.difficultyLevel) {
        console.log('\n🎉 SUCCESS! Backend automatically updated the content!');
      } else {
        console.log('\n❌ FAILED! Backend did not update the content automatically.');
      }
    } else {
      console.log('❌ Could not retrieve saved result');
    }
    
    // Cleanup
    await axios.delete(`${API_BASE_URL}/rooms/${room.roomCode}`);
    console.log('\n🧹 Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

simpleTest();