<template>
  <div class="ai-patient">
    <!-- Main Content -->
    <main class="main-content">
      <!-- AI Patient Content -->
      <div class="ai-patient-content">
        
        <!-- AI Patient Simulation Interface -->
        <div class="simulation-container">
          
          <!-- Virtual Patient Section (Left Side) -->
          <div class="chat-section">
            <div class="chat-header">
              <div class="patient-info">
                <div class="patient-avatar">
                  <i class="fas fa-user-injured"></i>
                </div>
                <div class="patient-details">
                  <h3>Virtual Patient</h3>
                  <span class="patient-status" :class="sessionStarted ? 'online' : 'waiting'">
                    {{ sessionStarted ? 'Online' : 'Waiting' }}
                  </span>
                </div>
              </div>
              <div class="chat-controls">
                <!-- Back to Dashboard button - always visible for students -->
                <button 
                  class="back-to-dashboard-btn" 
                  @click="backToDashboard"
                >
                  <i class="fas fa-arrow-left"></i>
                  Back to Dashboard
                </button>
                <button 
                  v-if="!sessionStarted" 
                  class="start-session-btn" 
                  @click="startSession"
                >
                  <i class="fas fa-play"></i>
                  Start Session
                </button>
                <button 
                  v-else 
                  class="control-btn" 
                  @click="resetChat"
                >
                  <i class="fas fa-redo"></i>
                  Reset Chat
                </button>
              </div>
            </div>
            
            <div class="chat-messages" ref="chatMessages">
              <!-- Welcome Message when session hasn't started -->
              <div v-if="!sessionStarted" class="welcome-message">
                <div class="welcome-content">
                  <div class="welcome-icon">
                    <i class="fas fa-user-md"></i>
                  </div>
                  <h3 class="welcome-title">Ready to Start?</h3>
                  <p class="welcome-text">Click the "Start Session" button above to begin your virtual patient consultation.</p>
                </div>
              </div>
              
              <!-- Chat Messages -->
              <div 
                v-for="message in messages" 
                :key="message.id"
                :class="['message', message.sender === 'patient' ? 'patient-message' : 'student-message']"
              >
                <div class="message-avatar">
                  <i :class="message.sender === 'patient' ? 'fas fa-user-injured' : 'fas fa-user-md'"></i>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender-name">{{ message.sender === 'patient' ? 'Virtual Patient' : 'You' }}</span>
                    <span class="message-time">{{ message.time }}</span>
                  </div>
                  <!-- Voice message bubble for AI responses -->
                  <div v-if="message.sender === 'patient'" class="voice-message-bubble" :class="{ playing: currentPlayingMessageId === message.id && isVoicePlaying }">
                    <div class="voice-controls">
                      <button class="play-button" @click="toggleVoiceMessage(message.id, message.text)">
                        <i :class="currentPlayingMessageId === message.id && isVoicePlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                      </button>
                      <div class="voice-waveform">
                        <div class="waveform-bars">
                          <div class="bar" v-for="n in 20" :key="n"></div>
                        </div>
                      </div>
                      <span class="voice-duration">{{ message.duration || '0:15' }}</span>
                    </div>
                  </div>
                  <!-- Regular text message for student messages -->
                  <div v-else class="message-text">{{ message.text }}</div>
                </div>
              </div>
            </div>
            
            <!-- AI Controls Section -->
            <div class="ai-controls-section" v-if="sessionStarted">
              <div class="ai-status">
                <div class="speech-toggle">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="speechEnabled" @change="toggleSpeech">
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="toggle-label">Voice Responses</span>
                </div>
              </div>
            </div>
            
            <!-- Chat Input -->
            <div class="chat-input-section" v-if="sessionStarted">
              <div class="input-container">
                <textarea
                  v-model="currentMessage"
                  @keydown.enter.prevent="sendMessage"
                  placeholder="Type your message to the patient..."
                  class="message-input"
                  rows="3"
                  :disabled="isGeneratingResponse"
                ></textarea>
                <button 
                  @click="sendMessage" 
                  class="send-button"
                  :disabled="!currentMessage.trim() || isGeneratingResponse"
                >
                  <i v-if="isGeneratingResponse" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Consultation Form Section (Right Side) -->
          <div class="consultation-section">
            <div class="consultation-header">
              <h2>
                <i class="fas fa-clipboard-list"></i>
                Consultation Form
              </h2>
              <!-- Removed History button as requested -->
            </div>
            
            <div class="consultation-form">
              <!-- Patient Information Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="fas fa-user"></i>
                  Patient Information
                </h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Name:</label>
                    <input 
                      type="text" 
                      v-model="consultationData.patientName"
                      placeholder="Patient name"
                      class="form-input"
                    >
                  </div>
                  <div class="form-group">
                    <label>Date of Birth:</label>
                    <input 
                      type="date" 
                      v-model="consultationData.dateOfBirth"
                      class="form-input"
                    >
                  </div>
                  <div class="form-group">
                    <label>Gender:</label>
                    <select v-model="consultationData.gender" class="form-select">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Occupation:</label>
                    <input 
                      type="text" 
                      v-model="consultationData.occupation"
                      placeholder="Patient occupation"
                      class="form-input"
                    >
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Address:</label>
                  <textarea 
                    v-model="consultationData.address"
                    placeholder="Patient address"
                    class="form-textarea"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              
              <!-- Findings Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="fas fa-stethoscope"></i>
                  Findings
                </h3>
                <div class="form-group">
                  <label>Chief Complaint:</label>
                  <textarea 
                    v-model="consultationData.chiefComplaint"
                    placeholder="Primary reason for visit"
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Present Illness:</label>
                  <textarea 
                    v-model="consultationData.presentIllness"
                    placeholder="Current symptoms and timeline"
                    class="form-textarea"
                    rows="4"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Past Illnesses:</label>
                  <textarea 
                    v-model="consultationData.pastIllness"
                    placeholder="Previous medical conditions"
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Allergies:</label>
                  <textarea 
                    v-model="consultationData.allergies"
                    placeholder="Known allergies"
                    class="form-textarea"
                    rows="2"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Medications:</label>
                  <textarea 
                    v-model="consultationData.medications"
                    placeholder="Current medications"
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Previous Surgeries:</label>
                  <textarea 
                    v-model="consultationData.previousSurgeries"
                    placeholder="Previous surgical procedures"
                    class="form-textarea"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              
              <!-- Recommendations Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="fas fa-prescription-bottle-alt"></i>
                  Recommendations
                </h3>
                <div class="form-group">
                  <label>Treatment Plan:</label>
                  <textarea 
                    v-model="consultationData.treatmentPlan"
                    placeholder="Recommended treatment approach"
                    class="form-textarea"
                    rows="4"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Follow-up Instructions:</label>
                  <textarea 
                    v-model="consultationData.followUpInstructions"
                    placeholder="Follow-up care instructions"
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Additional Notes:</label>
                  <textarea 
                    v-model="consultationData.additionalNotes"
                    placeholder="Any additional observations or notes"
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="form-actions">
                <!-- Removed Save Form button as requested -->
                <button 
                  @click="submitToTeacher" 
                  class="btn btn-primary"
                  :disabled="!isFormValid || isSubmitting"
                >
                  <i v-if="isSubmitting" class="fas fa-spinner fa-spin me-2"></i>
                  <i v-else class="fas fa-paper-plane me-2"></i>
                  {{ isSubmitting ? 'Submitting...' : 'Submit to Teacher' }}
                </button>
                <button 
                  @click="showFeedback" 
                  class="btn btn-secondary ms-2"
                  :disabled="isLoadingFeedback"
                >
                  <i v-if="isLoadingFeedback" class="fas fa-spinner fa-spin me-2"></i>
                  <i v-else class="fas fa-comment-dots me-2"></i>
                  {{ isLoadingFeedback ? 'Loading...' : 'View Feedback' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click="closeFeedbackModal">
      <div class="modal-content feedback-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-comment-dots me-2"></i>
            Teacher Feedback
          </h3>
          <button class="close-btn" @click="closeFeedbackModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="feedbackError" class="error-message">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ feedbackError }}
          </div>
          
          <div v-else-if="consultationFeedback">
            <div class="feedback-info">
              <div class="feedback-header-info">
                <span class="feedback-author">
                  <i class="fas fa-user me-1"></i>
                  {{ consultationFeedback.teacherName }}
                </span>
                <span class="feedback-date">
                  <i class="fas fa-calendar me-1"></i>
                  {{ formatDate(consultationFeedback.createdAt) }}
                </span>
                <span v-if="consultationFeedback.score !== undefined" class="feedback-score">
                  <i class="fas fa-star me-1"></i>
                  {{ consultationFeedback.score }}/100
                </span>
              </div>
              <div class="feedback-content">
                {{ consultationFeedback.content }}
              </div>
            </div>
          </div>
          
          <div v-else class="no-feedback">
            <i class="fas fa-info-circle me-2"></i>
            No feedback available yet. Your teacher hasn't provided feedback for this consultation.
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeFeedbackModal">
            <i class="fas fa-times me-2"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Back to Dashboard Confirmation Modal -->
  <div v-if="showBackToDashboardModal" class="modal-overlay" @click="closeBackToDashboardModal">
    <div class="modal-content confirmation-modal" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-exclamation-triangle"></i>
          Confirm Navigation
        </h3>
        <button class="close-btn" @click="closeBackToDashboardModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="warning-message">
          <div class="warning-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="warning-text">
            <p><strong>Are you sure you want to return to your dashboard?</strong></p>
            <p>
              You are about to leave the AI Patient simulation. Any unsaved progress in your current session may be lost.
            </p>
            <p>
              Make sure you have completed all required tasks and saved your consultation form before proceeding.
            </p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeBackToDashboardModal">
          <i class="fas fa-times me-2"></i>
          Cancel
        </button>
        <button class="btn btn-primary" @click="confirmBackToDashboard">
          <i class="fas fa-arrow-left me-2"></i>
          Yes, Go to Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import sessionService from '../services/sessionService';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

export default {
  name: 'AIPatientRoom',
  data() {
    return {
      // Session state
      sessionStarted: false,
      roomCode: null,
      currentUserId: null,
      currentUserName: '',
      
      // Chat state
      messages: [],
      currentMessage: '',
      messageIdCounter: 1,
      isGeneratingResponse: false,
      requestQueue: [],
      isProcessingQueue: false,
      retryCount: 0,
      maxRetries: 3,
      
      // Voice state
      speechEnabled: true,
      isVoicePlaying: false,
      currentPlayingMessageId: null,
      speechSynthesis: null,
      genderUpdated: false,
      selectedVoice: null, // Pre-selected voice based on predetermined gender
      
      // Patient profile (generated uniquely per student)
      patientProfile: {
        name: 'Virtual Patient',
        age: 30,
        gender: 'Unknown',
        occupation: 'Unknown',
        condition: 'General Consultation'
      },
      
      // Consultation form data
      consultationData: {
        patientName: '',
        dateOfBirth: '',
        gender: '',
        occupation: '',
        address: '',
        chiefComplaint: '',
        presentIllness: '',
        pastIllness: '',
        allergies: '',
        medications: '',
        previousSurgeries: '',
        treatmentPlan: '',
        followUpInstructions: '',
        additionalNotes: ''
      },
      
      // Submission state
      isSubmitting: false,
      submissionStatus: 'Not submitted',
      
      // Feedback state
      showFeedbackModal: false,
      isLoadingFeedback: false,
      consultationFeedback: null,
      feedbackError: null,
      
      // Back to Dashboard modal state
      showBackToDashboardModal: false,
      
      // Room status tracking
      roomData: null,
      roomStatus: 'waiting', // waiting, active, completed
      isLoadingRoomStatus: false,
      statusCheckInterval: null
    };
  },
  computed: {
    isFormValid() {
      return this.consultationData.patientName.trim() !== '' &&
             this.consultationData.chiefComplaint.trim() !== '' &&
             this.consultationData.presentIllness.trim() !== '';
    },
    isRoomCompleted() {
      return this.roomStatus === 'completed';
    }
  },
  async mounted() {
    try {
      // Get room code from route params
      this.roomCode = this.$route.params.roomCode;
      
      // Get current student session to get the correct student ID
      const studentSession = await sessionService.getStudentSession();
      if (studentSession && studentSession.studentData) {
        this.currentUserId = studentSession.studentData.studentId;
        this.currentUserName = studentSession.studentData.studentName || 'Student';
        console.log('Using student ID from session:', this.currentUserId);
      } else {
        // Fallback: try localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.id) {
          this.currentUserId = userData.id;
          this.currentUserName = userData.name || userData.username || 'Student';
          console.log('Using student ID from localStorage:', this.currentUserId);
        } else {
          // Last resort: generate a temporary student ID
          this.currentUserId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          this.currentUserName = 'Student';
          console.warn('No user data found, using temporary ID:', this.currentUserId);
        }
      }

      // Ensure we have both roomCode and currentUserId before generating patient
      if (!this.roomCode || !this.currentUserId) {
        throw new Error(`Missing required data - roomCode: ${this.roomCode}, currentUserId: ${this.currentUserId}`);
      }

      // Load room status to check if activity is completed
      await this.loadRoomStatus();
      
      // Start monitoring room status for changes
      this.startRoomStatusMonitoring();
      
      // Generate unique patient for this student in this room
      await this.generatePatientProfile();
      
      // Initialize speech synthesis
      this.initializeSpeechSynthesis();
    } catch (error) {
      console.error('Error in AIPatientRoom mounted:', error);
    }
  },

  beforeUnmount() {
    // Clean up room status monitoring
    this.stopRoomStatusMonitoring();
  },

  methods: {
    async generatePatientProfile() {
      try {
        // Validate required data
        if (!this.roomCode || !this.currentUserId) {
          throw new Error(`Missing required data - roomCode: ${this.roomCode}, currentUserId: ${this.currentUserId}`);
        }

        // Initialize AI Patient room (no automatic patient generation)
        const seed = `${this.roomCode}-${this.currentUserId}`;
        const requestData = {
          seed: seed,
          roomCode: this.roomCode,
          studentId: this.currentUserId
        };

        console.log('Initializing AI Patient room with data:', requestData);

        const response = await axios.post(`${API_BASE_URL}/ai/generate-patient`, requestData);

        if (response.data.success) {
          console.log('AI Patient room initialized:', response.data.message);
          console.log('Instructions:', response.data.instructions);
          
          // Set basic patient profile for chat display only
          this.patientProfile = {
            name: 'Virtual Patient',
            age: 'Unknown',
            gender: 'Unknown',
            occupation: 'Unknown',
            condition: 'To be discovered'
          };
          
          // Keep consultation form completely empty - students must fill manually
          // No auto-population of any fields
        } else {
          throw new Error('Failed to initialize AI Patient room');
        }
      } catch (error) {
        console.error('Error initializing AI Patient room:', error);
        console.error('Request details:', {
          roomCode: this.roomCode,
          currentUserId: this.currentUserId,
          seed: `${this.roomCode}-${this.currentUserId}`
        });
        
        // Set minimal patient profile even on error
        this.patientProfile = {
          name: 'Virtual Patient',
          age: 'Unknown',
          gender: 'Unknown',
          occupation: 'Unknown',
          condition: 'To be discovered'
        };
        
        // Keep consultation form empty - no fallback data
      }
    },
    
    startSession() {
      // Generate random gender for voice consistency
      const genders = ['Male', 'Female'];
      const randomGender = genders[Math.floor(Math.random() * genders.length)];
      
      // Set the predetermined gender in patient profile
      this.patientProfile.gender = randomGender;
      
      // Initialize voice for the predetermined gender
      this.initializeVoiceForGender();
      
      this.sessionStarted = true;
      // No initial message - students must initiate conversation naturally
    },
    
    resetChat() {
      this.messages = [];
      this.currentMessage = '';
      this.messageIdCounter = 1;
      this.startSession();
    },
    
    addMessage(sender, text, duration = null) {
      // Calculate duration automatically for patient messages if not provided
      const calculatedDuration = duration || (sender === 'patient' ? this.calculateSpeechDuration(text) : null);
      
      const message = {
        id: this.messageIdCounter++,
        sender: sender,
        text: text,
        time: this.getCurrentTime(),
        duration: calculatedDuration
      };
      this.messages.push(message);
      this.$nextTick(() => {
        this.scrollToBottom();
      });
      return message;
    },
    
    async sendMessage() {
      if (!this.currentMessage.trim() || this.isGeneratingResponse) return;
      
      const userMessage = this.addMessage('student', this.currentMessage.trim());
      const messageText = this.currentMessage.trim();
      this.currentMessage = '';
      
      // Add request to queue for processing
      this.queueRequest(userMessage, messageText);
    },
    
    queueRequest(userMessage, messageText) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const request = {
        id: requestId,
        userMessage: userMessage,
        messageText: messageText,
        timestamp: Date.now(),
        studentId: this.currentUserId
      };
      
      this.requestQueue.push(request);
      this.processQueue();
    },
    
    async processQueue() {
      if (this.isProcessingQueue || this.requestQueue.length === 0) return;
      
      this.isProcessingQueue = true;
      
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        await this.generatePatientResponse(request.userMessage, request.messageText);
        
        // Add small delay between requests to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.isProcessingQueue = false;
    },
    
    async generatePatientResponse(userMessage) {
      this.isGeneratingResponse = true;
      
      try {
        // Prepare conversation history
        const conversationHistory = this.messages.slice(-10).map(msg => ({
          sender: msg.sender === 'student' ? 'nurse' : 'patient',
          message: msg.text
        }));
        
        // Prepare patient context with unique session identifier
        const patientContext = {
          sessionId: `${this.roomCode}-${this.currentUserId}`,
          studentId: this.currentUserId,
          roomCode: this.roomCode,
          patientData: {
            name: this.patientProfile.name,
            age: this.patientProfile.age,
            gender: this.patientProfile.gender,
            condition: this.patientProfile.condition
          },
          findings: {
            chiefComplaint: this.patientProfile.chiefComplaint,
            symptoms: this.patientProfile.symptoms || [],
            medicalHistory: this.patientProfile.medicalHistory || '',
            allergies: this.patientProfile.allergies || '',
            medications: this.patientProfile.medications || ''
          }
        };

        // Add request timestamp and unique identifier for debugging
        const requestData = {
          message: userMessage.text,
          patientContext: patientContext,
          conversationHistory: conversationHistory,
          includeAudio: this.speechEnabled,
          requestId: `${this.currentUserId}_${Date.now()}`,
          timestamp: new Date().toISOString()
        };

        console.log(`[${this.currentUserName}] Sending AI request:`, requestData.requestId);

        const response = await this.makeAPIRequestWithRetry(requestData);

        if (response.data.success) {
          console.log(`[${this.currentUserName}] Received AI response:`, requestData.requestId);
          this.addMessage('patient', response.data.response);
          
          // Extract patient information from AI response to update profile
          this.extractPatientInfoFromResponse(response.data.response);
          
          // Handle voice playback with user-specific timing
          if (this.speechEnabled) {
            // Add small random delay to prevent speech conflicts
            const delay = Math.random() * 1000 + 500; // 500-1500ms delay
            setTimeout(() => {
              this.speakTextWithBrowser(response.data.response);
            }, delay);
          }
          
          // Reset retry count on success
          this.retryCount = 0;
        }
      } catch (error) {
        console.error(`[${this.currentUserName}] Error generating AI response:`, error);
        
        // Provide more specific error messages
        let errorMessage = "I'm sorry, I'm having trouble responding right now.";
        if (error.response?.status === 429) {
          errorMessage = "I'm a bit busy right now. Please wait a moment and try again.";
        } else if (error.response?.status >= 500) {
          errorMessage = "I'm experiencing some technical difficulties. Please try again in a moment.";
        }
        
        this.addMessage('patient', errorMessage);
      } finally {
        this.isGeneratingResponse = false;
      }
    },
    
    async makeAPIRequestWithRetry(requestData, attempt = 1) {
      try {
        const response = await axios.post(`${API_BASE_URL}/ai/chat-with-speech`, requestData, {
          timeout: 30000, // 30 second timeout
          headers: {
            'X-Student-ID': this.currentUserId,
            'X-Room-Code': this.roomCode,
            'X-Request-ID': requestData.requestId
          }
        });
        return response;
      } catch (error) {
        if (attempt < this.maxRetries && (error.response?.status === 429 || error.response?.status >= 500)) {
          console.log(`[${this.currentUserName}] Retrying request (attempt ${attempt + 1}/${this.maxRetries}):`, requestData.requestId);
          
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          const jitter = Math.random() * 1000; // 0-1s random jitter
          const delay = baseDelay + jitter;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeAPIRequestWithRetry(requestData, attempt + 1);
        }
        throw error;
      }
    },
    
    async submitToTeacher() {
      if (!this.isFormValid || this.isSubmitting) return;
      
      this.isSubmitting = true;
      
      try {
        const submissionData = {
          roomCode: this.roomCode,
          studentId: this.currentUserId,
          studentName: this.currentUserName,
          patientData: this.patientProfile,
          consultationData: this.consultationData,
          conversationHistory: this.messages,
          submissionTime: new Date().toISOString()
        };

        const response = await axios.post(`${API_BASE_URL}/ai/submit-assessment`, submissionData);

        if (response.data.success) {
          this.submissionStatus = 'Submitted successfully';
          alert('Assessment submitted successfully to your teacher!');
        }
      } catch (error) {
        console.error('Error submitting assessment:', error);
        alert('Failed to submit assessment. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // Voice and UI helper methods
    initializeSpeechSynthesis() {
      if ('speechSynthesis' in window) {
        this.speechSynthesis = window.speechSynthesis;
      }
    },
    
    toggleSpeech() {
      // Speech toggle functionality
    },
    
    toggleVoiceMessage(messageId, text) {
      if (this.currentPlayingMessageId === messageId && this.isVoicePlaying) {
        this.stopVoiceMessage();
      } else {
        this.playVoiceMessage(messageId, text);
      }
    },
    
    playVoiceMessage(messageId, text) {
      this.stopVoiceMessage();
      this.currentPlayingMessageId = messageId;
      this.isVoicePlaying = true;
      this.speakTextWithBrowser(text);
    },
    
    stopVoiceMessage() {
      if (this.speechSynthesis) {
        this.speechSynthesis.cancel();
      }
      this.isVoicePlaying = false;
      this.currentPlayingMessageId = null;
    },
    
    speakTextWithBrowser(text) {
      if (!this.speechSynthesis || !this.speechEnabled) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Extract gender from the current response before setting voice
      this.extractPatientInfoFromResponse(text);
      
      // Set voice based on patient gender (with updated information)
      this.setVoiceForUtterance(utterance);
      
      utterance.onend = () => {
        this.isVoicePlaying = false;
        this.currentPlayingMessageId = null;
      };
      
      this.speechSynthesis.speak(utterance);
    },

    // Initialize voice based on predetermined gender (called at session start)
    initializeVoiceForGender() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If voices aren't loaded yet, try again after a short delay
        setTimeout(() => {
          this.initializeVoiceForGender();
        }, 100);
        return;
      }
      
      // Store the selected voice for this session
      this.selectedVoice = this.getVoiceForGender(voices);
      console.log('Voice initialized for gender:', this.patientProfile.gender, 'Selected voice:', this.selectedVoice?.name);
    },

    // Get appropriate voice for the current patient gender
    getVoiceForGender(voices) {
      let selectedVoice = null;
      const patientGender = this.patientProfile?.gender;
      
      if (patientGender === 'Female') {
        // Enhanced female voice detection
        const femaleKeywords = [
          'female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'cortana', 'siri',
          'eva', 'anna', 'emma', 'sophia', 'olivia', 'ava', 'isabella', 'mia'
        ];
        
        selectedVoice = voices.find(voice => 
          femaleKeywords.some(keyword => 
            voice.name.toLowerCase().includes(keyword)
          )
        );
        
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft') && 
            (voice.name.toLowerCase().includes('zira') || 
             voice.name.toLowerCase().includes('hazel') ||
             voice.name.toLowerCase().includes('eva'))
          );
        }
        
      } else if (patientGender === 'Male') {
        // Enhanced male voice detection
        const maleKeywords = [
          'male', 'man', 'david', 'mark', 'alex', 'daniel', 'james', 'john',
          'michael', 'robert', 'william', 'richard', 'thomas', 'christopher'
        ];
        
        selectedVoice = voices.find(voice => 
          maleKeywords.some(keyword => 
            voice.name.toLowerCase().includes(keyword)
          )
        );
        
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft') && 
            (voice.name.toLowerCase().includes('david') || 
             voice.name.toLowerCase().includes('mark') ||
             voice.name.toLowerCase().includes('george'))
          );
        }
      }

      // Final fallback: use first available English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      }

      return selectedVoice;
    },

    // Helper method to set voice for utterance based on patient gender
    setVoiceForUtterance(utterance) {
      // Use pre-selected voice if available (from session start)
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        console.log('Using pre-selected voice:', this.selectedVoice.name, 'for gender:', this.patientProfile.gender);
        return;
      }
      
      // Fallback to dynamic selection if no pre-selected voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If voices aren't loaded yet, try again after a short delay
        setTimeout(() => {
          const voicesRetry = window.speechSynthesis.getVoices();
          if (voicesRetry.length > 0) {
            this.selectVoiceByGender(utterance, voicesRetry);
          }
        }, 100);
        return;
      }
      this.selectVoiceByGender(utterance, voices);
    },

    // Helper method to select voice by gender
    selectVoiceByGender(utterance, voices) {
      let selectedVoice = null;
      const patientGender = this.patientProfile?.gender;
      
      console.log('Selecting voice for patient gender:', patientGender, '(Gender updated flag:', this.genderUpdated, ')');
      
      if (patientGender === 'Female') {
        // Enhanced female voice detection with more comprehensive keywords
        const femaleKeywords = [
          'female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'cortana', 'siri',
          'eva', 'anna', 'emma', 'sophia', 'olivia', 'ava', 'isabella', 'mia',
          'aria', 'elena', 'kate', 'sarah', 'maria', 'linda', 'karen', 'nancy',
          'helen', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura',
          'emily', 'kimberly', 'deborah', 'dorothy', 'lisa', 'betty', 'sandra'
        ];
        
        // First try: exact female keyword match
        selectedVoice = voices.find(voice => 
          femaleKeywords.some(keyword => 
            voice.name.toLowerCase().includes(keyword)
          )
        );
        
        // Second try: voices that typically sound female (Windows voices)
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft') && 
            (voice.name.toLowerCase().includes('zira') || 
             voice.name.toLowerCase().includes('hazel') ||
             voice.name.toLowerCase().includes('eva'))
          );
        }
        
        // Third try: filter by language and pick non-male sounding names
        if (!selectedVoice) {
          const englishVoices = voices.filter(voice => 
            voice.lang.startsWith('en') && 
            !voice.name.toLowerCase().includes('male') &&
            !voice.name.toLowerCase().includes('man') &&
            !voice.name.toLowerCase().includes('david') &&
            !voice.name.toLowerCase().includes('mark') &&
            !voice.name.toLowerCase().includes('alex') &&
            !voice.name.toLowerCase().includes('daniel') &&
            !voice.name.toLowerCase().includes('james') &&
            !voice.name.toLowerCase().includes('john') &&
            !voice.name.toLowerCase().includes('michael') &&
            !voice.name.toLowerCase().includes('george') &&
            !voice.name.toLowerCase().includes('paul')
          );
          
          // Pick the second voice if available (often female)
          selectedVoice = englishVoices.length > 1 ? englishVoices[1] : englishVoices[0];
        }
        
      } else if (patientGender === 'Male') {
        // Enhanced male voice detection with more comprehensive keywords
        const maleKeywords = [
          'male', 'man', 'david', 'mark', 'alex', 'daniel', 'james', 'john',
          'michael', 'robert', 'william', 'richard', 'thomas', 'christopher',
          'matthew', 'anthony', 'donald', 'steven', 'paul', 'andrew',
          'joshua', 'kenneth', 'kevin', 'brian', 'george', 'edward',
          'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob'
        ];
        
        // First try: exact male keyword match
        selectedVoice = voices.find(voice => 
          maleKeywords.some(keyword => 
            voice.name.toLowerCase().includes(keyword)
          )
        );
        
        // Second try: voices that typically sound male (Windows voices)
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft') && 
            (voice.name.toLowerCase().includes('david') || 
             voice.name.toLowerCase().includes('mark') ||
             voice.name.toLowerCase().includes('george'))
          );
        }
        
        // Third try: filter by language and pick male-sounding names
        if (!selectedVoice) {
          const englishVoices = voices.filter(voice => 
            voice.lang.startsWith('en') && 
            !voice.name.toLowerCase().includes('female') &&
            !voice.name.toLowerCase().includes('woman') &&
            !voice.name.toLowerCase().includes('zira') &&
            !voice.name.toLowerCase().includes('hazel') &&
            !voice.name.toLowerCase().includes('eva')
          );
          
          // Pick the first voice (often male by default)
          selectedVoice = englishVoices[0];
        }
      } else {
        // For unknown gender, try to use a neutral voice
        console.log('Gender unknown, selecting neutral voice');
        const neutralVoices = voices.filter(voice => voice.lang.startsWith('en'));
        selectedVoice = neutralVoices[0];
      }

      // Final fallback: use first available English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Selected voice:', selectedVoice.name, 'for gender:', patientGender);
        
        // Reset the gender updated flag after successful voice selection
        if (this.genderUpdated) {
          this.genderUpdated = false;
          console.log('Gender updated flag reset after voice selection');
        }
      }
    },
    
    getCurrentTime() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },

    // Extract patient information from AI responses to update profile
    extractPatientInfoFromResponse(response) {
      const text = response.toLowerCase();
      const originalResponse = response; // Keep original case for proper names
      
      // Extract name - enhanced patterns for AI-generated names
      const namePatterns = [
        /(?:i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /(?:my name is|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /(?:call me)\s+([A-Z][a-z]+)/g,
        /(?:i go by)\s+([A-Z][a-z]+)/g,
        /(?:you can call me)\s+([A-Z][a-z]+)/g
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = originalResponse.match(pattern);
        if (nameMatch && nameMatch[1] && nameMatch[1].trim().toLowerCase() !== 'virtual patient') {
          const extractedName = nameMatch[1].trim();
          // Validate it's a proper name (starts with capital, reasonable length)
          if (extractedName.length >= 2 && extractedName.length <= 50 && /^[A-Z]/.test(extractedName)) {
            this.patientProfile.name = extractedName;
            console.log('Extracted patient name:', this.patientProfile.name);
            break;
          }
        }
      }
      
      // Extract age - enhanced patterns
      const agePatterns = [
        /(?:i'm|i am)\s+(\d+)(?:\s+years?\s+old)?/i,
        /(?:my age is|age is)\s+(\d+)/i,
        /(\d+)\s+years?\s+old/i,
        /(?:i'm|i am)\s+(\d+)(?:-year-old)?/i,
        /(?:age|aged)\s+(\d+)/i
      ];
      
      for (const pattern of agePatterns) {
        const ageMatch = response.match(pattern);
        if (ageMatch && ageMatch[1]) {
          const age = parseInt(ageMatch[1]);
          if (age >= 1 && age <= 120) {
            this.patientProfile.age = age;
            console.log('Extracted patient age:', this.patientProfile.age);
            break;
          }
        }
      }
      
      // Extract gender - enhanced indicators and patterns
      // IMPORTANT: Only detect gender if it's currently unknown to maintain voice consistency
      if (this.patientProfile.gender === 'Unknown') {
        const femaleIndicators = ['woman', 'female', 'girl', 'lady', 'she', 'her', 'herself', 'ms.', 'mrs.', 'miss', 'daughter', 'sister', 'mother', 'wife', 'girlfriend', 'aunt', 'niece', 'grandmother'];
        const maleIndicators = ['man', 'male', 'boy', 'gentleman', 'he', 'him', 'himself', 'mr.', 'sir', 'son', 'brother', 'father', 'husband', 'boyfriend', 'uncle', 'nephew', 'grandfather'];
        
        // Store previous gender to detect changes
        const previousGender = this.patientProfile.gender;
        
        // Direct gender statements - enhanced patterns
        const genderPatterns = [
          /(?:i am|i'm)\s+(?:a\s+)?(female|male|woman|man)/i,
          /(?:my gender is|gender is)\s+(female|male|woman|man)/i,
          /(?:i identify as|identify as)\s+(?:a\s+)?(female|male|woman|man)/i,
          /(?:i'm|i am)\s+(?:a\s+)?\d+(?:-year-old)?\s+(female|male|woman|man)/i,
          /(?:as a|being a)\s+(female|male|woman|man)/i
        ];
        
        for (const pattern of genderPatterns) {
          const genderMatch = response.match(pattern);
          if (genderMatch && genderMatch[1]) {
            const gender = genderMatch[1].toLowerCase();
            if (['female', 'woman'].includes(gender)) {
              this.patientProfile.gender = 'Female';
              console.log('Extracted patient gender: Female (direct pattern) - Voice will remain consistent');
              break;
            } else if (['male', 'man'].includes(gender)) {
              this.patientProfile.gender = 'Male';
              console.log('Extracted patient gender: Male (direct pattern) - Voice will remain consistent');
              break;
            }
          }
        }
        
        // Fallback to indicator-based detection if no direct statement
        if (this.patientProfile.gender === 'Unknown') {
          const femaleCount = femaleIndicators.filter(indicator => text.includes(indicator)).length;
          const maleCount = maleIndicators.filter(indicator => text.includes(indicator)).length;
          
          // Use count-based approach for better accuracy
          if (femaleCount > maleCount && femaleCount > 0) {
            this.patientProfile.gender = 'Female';
            console.log('Extracted patient gender: Female (indicators)', femaleCount, 'vs', maleCount, '- Voice will remain consistent');
          } else if (maleCount > femaleCount && maleCount > 0) {
            this.patientProfile.gender = 'Male';
            console.log('Extracted patient gender: Male (indicators)', maleCount, 'vs', femaleCount, '- Voice will remain consistent');
          }
        }
        
        // If gender was detected for the first time, update voice selection for future speech
        if (this.patientProfile.gender !== 'Unknown' && this.patientProfile.gender !== previousGender) {
          console.log('Patient gender determined as', this.patientProfile.gender, '- voice will be consistent for all future speech');
          // Store the gender determination for voice update
          this.genderUpdated = true;
        }
      } else {
        // Gender already determined - skip re-detection to maintain voice consistency
        console.log('Gender already determined as', this.patientProfile.gender, '- Skipping re-detection to maintain voice consistency');
      }
      
      // Extract occupation - enhanced patterns
      const occupationPatterns = [
        /(?:i work as|work as)\s+(?:a|an)?\s*([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:i'm a|i am a)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:my job is|job is)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:i'm employed as|employed as)\s+(?:a|an)?\s*([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:my occupation is|occupation is)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:i do|i work in)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:profession|career).*?(?:is|as)\s+(?:a|an)?\s*([a-z\s-]+?)(?:\.|,|!|\?|$)/i
      ];
      
      for (const pattern of occupationPatterns) {
        const occupationMatch = response.match(pattern);
        if (occupationMatch && occupationMatch[1]) {
          let occupation = occupationMatch[1].trim();
          // Clean up the occupation
          occupation = occupation.replace(/\s+/g, ' '); // normalize spaces
          
          // Filter out common non-occupation words and phrases
          const excludeWords = ['patient', 'person', 'here', 'today', 'virtual', 'feeling', 'having', 'experiencing', 'pain', 'problem'];
          const excludePhrases = ['not sure', 'don\'t know', 'can\'t remember'];
          
          const isValidOccupation = !excludeWords.some(word => occupation.toLowerCase().includes(word)) &&
                                   !excludePhrases.some(phrase => occupation.toLowerCase().includes(phrase)) &&
                                   occupation.length >= 3 && occupation.length <= 50;
          
          if (isValidOccupation) {
            // Capitalize first letter of each word
            this.patientProfile.occupation = occupation.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            console.log('Extracted patient occupation:', this.patientProfile.occupation);
            break;
          }
        }
      }
      
      // Extract medical condition/chief complaint - new feature for AI-generated content
      const conditionPatterns = [
        /(?:i have|i'm having|i've been having)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:suffering from|dealing with)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:my condition is|condition is)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:diagnosed with|been diagnosed with)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i,
        /(?:experiencing|feeling)\s+([a-z\s-]+?)(?:\.|,|!|\?|$)/i
      ];
      
      for (const pattern of conditionPatterns) {
        const conditionMatch = response.match(pattern);
        if (conditionMatch && conditionMatch[1]) {
          let condition = conditionMatch[1].trim();
          condition = condition.replace(/\s+/g, ' '); // normalize spaces
          
          // Filter out vague or non-medical terms
          const medicalKeywords = ['pain', 'ache', 'fever', 'headache', 'nausea', 'fatigue', 'dizzy', 'chest', 'stomach', 'back', 'joint', 'muscle', 'breathing', 'cough', 'cold', 'flu', 'infection', 'diabetes', 'hypertension', 'anxiety', 'depression'];
          const hasValidMedicalTerm = medicalKeywords.some(keyword => condition.toLowerCase().includes(keyword));
          
          if (hasValidMedicalTerm && condition.length >= 4 && condition.length <= 100) {
            this.patientProfile.condition = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
            console.log('Extracted patient condition:', this.patientProfile.condition);
            break;
          }
        }
      }
      
      // Store additional extracted information for potential future use
      if (!this.patientProfile.extractedInfo) {
        this.patientProfile.extractedInfo = {};
      }
      
      // Track extraction timestamp
      this.patientProfile.extractedInfo.lastUpdated = new Date().toISOString();
      this.patientProfile.extractedInfo.responseAnalyzed = response.substring(0, 100) + '...';
      
      console.log('Updated patient profile:', this.patientProfile);
    },

    // Feedback methods
    async showFeedback() {
      this.showFeedbackModal = true;
      this.isLoadingFeedback = true;
      this.feedbackError = null;
      this.consultationFeedback = null;
      
      try {
        // Fetch the student's consultation data to get feedback
        const response = await axios.get(`${API_BASE_URL}/consultations/student/${this.currentUserId}`);
        
        if (response.data.success && response.data.consultation) {
          if (response.data.consultation.teacherFeedback) {
            this.consultationFeedback = response.data.consultation.teacherFeedback;
          } else {
            this.consultationFeedback = null; // No feedback yet
          }
        } else {
          this.feedbackError = 'No consultation found. Please submit your consultation first.';
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        if (error.response?.status === 404) {
          this.feedbackError = 'No consultation found. Please submit your consultation first.';
        } else {
          this.feedbackError = 'Failed to load feedback. Please try again.';
        }
      } finally {
        this.isLoadingFeedback = false;
      }
    },
    
    closeFeedbackModal() {
      this.showFeedbackModal = false;
      this.consultationFeedback = null;
      this.feedbackError = null;
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Unknown date';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch (error) {
        return 'Invalid date';
      }
    },

    // Method to calculate estimated duration of speech
    calculateSpeechDuration(text, rate = 0.9) {
      // Average speaking rate is about 150-160 words per minute for normal speech
      // With rate 0.9, it's slightly slower, so we use about 135 words per minute
      const wordsPerMinute = 135 * rate;
      const words = text.trim().split(/\s+/).length;
      const durationInMinutes = words / wordsPerMinute;
      const durationInSeconds = Math.ceil(durationInMinutes * 60);
      
      // Format as MM:SS
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = durationInSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    async loadRoomStatus() {
      if (!this.roomCode) return;
      
      try {
        this.isLoadingRoomStatus = true;
        const response = await this.$http.get(`/api/rooms/${this.roomCode}`);
        if (response.data && response.data.room) {
          this.roomData = response.data.room;
          this.roomStatus = response.data.room.status || 'waiting';
        }
      } catch (error) {
        console.error('Error loading room status:', error);
      } finally {
        this.isLoadingRoomStatus = false;
      }
    },

    startRoomStatusMonitoring() {
      // Check room status every 5 seconds
      this.statusCheckInterval = setInterval(async () => {
        await this.loadRoomStatus();
      }, 5000);
    },

    stopRoomStatusMonitoring() {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
        this.statusCheckInterval = null;
      }
    },

    backToDashboard() {
      // Show confirmation modal instead of direct navigation
      this.showBackToDashboardModal = true;
    },

    closeBackToDashboardModal() {
      this.showBackToDashboardModal = false;
    },

    confirmBackToDashboard() {
      // Close modal and navigate to student dashboard
      this.showBackToDashboardModal = false;
      this.$router.push('/user');
    }
  }
};
</script>

<style scoped>
/* Copy all styles from original AIPatient.vue */
.ai-patient {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.ai-patient-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.simulation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 80vh;
}

/* Chat Section Styles */
.chat-section {
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e9ecef;
}

.chat-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.patient-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.patient-details h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.patient-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.patient-status.online {
  background: #d4edda;
  color: #155724;
}

.patient-status.waiting {
  background: #fff3cd;
  color: #856404;
}

.start-session-btn, .control-btn, .back-to-dashboard-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-session-btn:hover, .control-btn:hover, .back-to-dashboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.back-to-dashboard-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  margin-right: 10px;
}

.back-to-dashboard-btn:hover {
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: 400px;
}

.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.welcome-content {
  max-width: 300px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 30px;
}

.welcome-title {
  color: #2c3e50;
  margin-bottom: 10px;
}

.welcome-text {
  color: #6c757d;
  line-height: 1.5;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.patient-message .message-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.student-message .message-avatar {
  background: #28a745;
  color: white;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 52px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.sender-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.message-time {
  color: #6c757d;
  font-size: 12px;
}

.voice-message-bubble {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 15px;
  transition: all 0.3s ease;
}

.voice-message-bubble.playing {
  border-color: #667eea;
  background: #f8f9ff;
}

.voice-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.play-button:hover {
  transform: scale(1.1);
}

.voice-waveform {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
}

.waveform-bars {
  display: flex;
  gap: 2px;
  height: 100%;
  align-items: center;
}

.bar {
  width: 3px;
  background: #667eea;
  border-radius: 2px;
  animation: wave 1.5s ease-in-out infinite;
}

.bar:nth-child(odd) {
  height: 60%;
  animation-delay: 0.1s;
}

.bar:nth-child(even) {
  height: 40%;
  animation-delay: 0.2s;
}

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}

.voice-duration {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 15px;
  border: 1px solid #e9ecef;
  line-height: 1.5;
  color: #2c3e50;
}

.ai-controls-section {
  background: white;
  padding: 15px 20px;
  border-top: 1px solid #e9ecef;
}

.ai-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speech-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #667eea;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-label {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.chat-input-section {
  background: white;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Consultation Section Styles */
.consultation-section {
  background: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 80vh;
}

.consultation-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.consultation-header h2 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.consultation-form {
  padding: 20px;
  flex: 1;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  color: #2c3e50;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: #495057;
  font-weight: 500;
  margin-bottom: 5px;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .simulation-container {
    grid-template-columns: 1fr;
  }
  
  .chat-section {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
  
  .chat-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

/* Feedback Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.feedback-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-modal .modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.feedback-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #667eea;
}

.feedback-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.feedback-author {
  font-weight: 600;
  color: #333;
}

.feedback-date {
  color: #666;
  font-size: 0.9rem;
}

.feedback-content {
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.no-feedback {
  text-align: center;
  color: #666;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 15px;
}

.btn.btn-secondary {
  background: #6c757d;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn.btn-secondary:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

.ms-2 {
  margin-left: 0.5rem;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}

/* Confirmation Modal Styles */
.confirmation-modal {
  max-width: 500px;
  width: 90%;
}

.confirmation-modal .modal-header {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirmation-modal .modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.confirmation-modal .modal-header h3 i {
  font-size: 1.4rem;
}

.confirmation-modal .close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.confirmation-modal .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.confirmation-modal .modal-body {
  padding: 2rem;
}

.warning-message {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.warning-icon {
  color: #f39c12;
  font-size: 2rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: #333;
}

.warning-text p:last-child {
  margin-bottom: 0;
}

.warning-text strong {
  color: #2c3e50;
  font-weight: 600;
}

.confirmation-modal .modal-footer {
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.confirmation-modal .btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confirmation-modal .btn.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.confirmation-modal .btn.btn-primary:hover {
  background: linear-gradient(135deg, #2980b9, #1f5f8b);
  transform: translateY(-1px);
}

.confirmation-modal .btn.btn-secondary {
  background: #6c757d;
  color: white;
}

.confirmation-modal .btn.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Feedback score styling */
.feedback-score {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 10px;
}

.feedback-score i {
  font-size: 10px;
}

.feedback-header-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.feedback-author,
.feedback-date {
  font-size: 14px;
  color: #6b7280;
}

.feedback-author i,
.feedback-date i {
  color: #9ca3af;
}

/* Dark theme adjustments */
[data-theme="dark"] .feedback-author,
[data-theme="dark"] .feedback-date {
  color: #d1d5db;
}

[data-theme="dark"] .feedback-author i,
[data-theme="dark"] .feedback-date i {
  color: #9ca3af;
}
</style>