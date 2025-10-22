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
                <!-- AI Responses toggle is now hidden, AI is always enabled -->
                
                <div class="speech-toggle">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="speechEnabled" @change="toggleSpeech">
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="toggle-label">
                    <i class="fas fa-volume-up"></i>
                    Speech
                  </span>
                </div>
                
                <div class="ai-status-indicator">
                  <span v-if="isGeneratingResponse" class="status-generating">
                    <i class="fas fa-spinner fa-spin"></i>
                    Generating response...
                  </span>
                  <span v-else-if="aiError" class="status-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    {{ aiError }}
                  </span>
                  <span v-else class="status-ready">
                    <i class="fas fa-robot"></i>
                    AI Ready
                  </span>
                </div>
              </div>
            </div>
            
            <div class="chat-input-section">
              <div class="input-container">
                <textarea 
                  v-model="currentMessage"
                  @keydown.enter.prevent="sendMessage"
                  :placeholder="sessionStarted ? 'Type your response to the patient...' : 'Start the session to begin chatting...'"
                  :disabled="!sessionStarted"
                  class="message-input"
                  rows="3"
                ></textarea>
                <button 
                  @click="sendMessage" 
                  :disabled="!currentMessage.trim() || !sessionStarted"
                  class="send-btn"
                >
                  <i class="fas fa-paper-plane"></i>
                  Send
                </button>
              </div>
            </div>
          </div>
          
          <!-- Consultation Form Section (Right Side) -->
          <div class="consultation-section">
            <div class="consultation-header">
              <h3>
                <i class="fas fa-clipboard-list"></i>
                Consultation Form
              </h3>
              <button class="history-btn" @click="fetchConsultationHistory(); showConsultationHistory = true">
                <i class="fas fa-history"></i>
                History
              </button>
            </div>
            
            <div class="consultation-form">
              <!-- Patient Information Section -->
              <div class="form-group">
                <h4 class="section-title">Patient Information</h4>
                <div class="form-row">
                  <div class="form-field">
                    <label>Name:</label>
                    <input type="text" class="form-input" placeholder="Patient name" v-model="consultationData.patientName">
                  </div>
                  <div class="form-field">
                    <label>Date of Birth:</label>
                    <input type="date" class="form-input" v-model="consultationData.dateOfBirth">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Gender:</label>
                    <select class="form-input" v-model="consultationData.gender">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>Occupation:</label>
                    <input type="text" class="form-input" placeholder="Occupation" v-model="consultationData.occupation">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full-width">
                    <label>Address:</label>
                    <input type="text" class="form-input" placeholder="Patient address" v-model="consultationData.address">
                  </div>
                </div>
              </div>

              <!-- Findings Section -->
              <div class="form-group">
                <h4 class="section-title"><i class="fas fa-notes-medical"></i> Findings</h4>
                <div class="form-field">
                  <label>Chief Complaint:</label>
                  <textarea v-model="consultationData.chiefComplaint" class="form-textarea" rows="3" placeholder="Primary reason for visit"></textarea>
                </div>
                <div class="form-field">
                  <label>Present Illness:</label>
                  <textarea v-model="consultationData.presentIllness" class="form-textarea" rows="4" placeholder="Current symptoms and timeline"></textarea>
                </div>
                <div class="form-field">
                  <label>Past Illnesses:</label>
                  <textarea v-model="consultationData.pastIllness" class="form-textarea" rows="3" placeholder="Previous medical conditions"></textarea>
                </div>
                <div class="form-field">
                  <label>Allergies:</label>
                  <textarea v-model="consultationData.allergies" class="form-textarea" rows="2" placeholder="Known allergies"></textarea>
                </div>
                <div class="form-field">
                  <label>Medications:</label>
                  <textarea v-model="consultationData.medications" class="form-textarea" rows="3" placeholder="Current medications"></textarea>
                </div>
                <div class="form-field">
                  <label>Previous Surgeries:</label>
                  <textarea v-model="consultationData.previousSurgeries" class="form-textarea" rows="3" placeholder="Surgical history"></textarea>
                </div>
              </div>

              <!-- Recommendation Section -->
              <div class="form-group">
                <h4 class="section-title"><i class="fas fa-lightbulb"></i> Recommendation</h4>
                <div class="form-field full-width">
                  <label>Treatment Plan:</label>
                  <textarea v-model="consultationData.treatmentPlan" placeholder="Recommended treatment plan" rows="3"></textarea>
                </div>
                <div class="form-field full-width">
                  <label>Follow-up Instructions:</label>
                  <textarea v-model="consultationData.followUpInstructions" placeholder="Follow-up care instructions" rows="2"></textarea>
                </div>
                <div class="form-field full-width">
                  <label>Additional Notes:</label>
                  <textarea v-model="consultationData.additionalNotes" placeholder="Any additional recommendations" rows="2"></textarea>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="form-actions">
                <button class="save-btn" @click="saveConsultationForm">
                  <i class="fas fa-save"></i>
                  Save Form
                </button>

                <button v-if="showStatusButton" class="status-btn" @click="showStatus">
                  <i class="fas fa-clipboard-check"></i>
                  Status
                </button>
                <button class="clear-btn" @click="clearConsultationForm">
                  <i class="fas fa-trash"></i>
                  Clear Form
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- Animated Sticky Note Notification -->
       <div v-if="showSaveNotification" class="sticky-note-notification" :class="{ 'show': showSaveNotification }">
         <div class="sticky-note">
           <div class="sticky-note-header">
             <i class="fas fa-check-circle"></i>
             <span>Consultation Saved!</span>
           </div>
           <div class="sticky-note-body">
             Form has been successfully saved to your consultation history.
           </div>
         </div>
       </div>

       <!-- Consultation History Modal -->
       <div v-if="showConsultationHistory" class="modal-overlay" @click="closeHistoryModal">
         <div class="modal-content" @click.stop>
           <div class="modal-header">
             <h3>
               <i class="fas fa-history"></i>
               Consultation History
             </h3>
             <button class="close-btn" @click="closeHistoryModal">
               <i class="fas fa-times"></i>
             </button>
           </div>
           <div class="modal-body">
             <div class="history-table-container">
               <table class="history-table">
                 <thead>
                   <tr>
                     <th>Patient Name</th>
                     <th>Date</th>
                     <th>Time</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="consultation in consultationHistory" :key="consultation.id">
                     <td>{{ consultation.patientName }}</td>
                     <td>{{ formatDate(consultation.createdAt) }}</td>
                     <td>{{ formatTime(consultation.createdAt) }}</td>
                     <td>
                       <button class="view-btn" @click="viewConsultationDetails(consultation)">
                         <i class="fas fa-eye"></i>
                         View
                       </button>
                     </td>
                   </tr>
                   <tr v-if="consultationHistory.length === 0">
                     <td colspan="4" class="no-data">
                       <i class="fas fa-inbox"></i>
                       No consultation history found
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </div>

       <!-- Consultation Details Modal -->
       <div v-if="showConsultationDetails" class="modal-overlay" @click="closeDetailsModal">
         <div class="modal-content details-modal" @click.stop>
           <div class="modal-header">
             <h3>
               <i class="fas fa-file-medical"></i>
               Consultation Details
             </h3>
             <button class="close-btn" @click="closeDetailsModal">
               <i class="fas fa-times"></i>
             </button>
           </div>
           <div class="modal-body">
             <div v-if="selectedConsultation" class="consultation-details">
               <div class="detail-section">
                 <h4><i class="fas fa-user"></i> Patient Information</h4>
                 <div class="detail-grid">
                   <div class="detail-item">
                     <label>Name:</label>
                     <span>{{ selectedConsultation.patientName }}</span>
                   </div>
                   <div class="detail-item">
                     <label>Date:</label>
                     <span>{{ formatDate(selectedConsultation.createdAt) }}</span>
                   </div>
                   <div class="detail-item">
                     <label>Date of Birth:</label>
                     <span>{{ selectedConsultation.patientData?.dateOfBirth || 'Not specified' }}</span>
                   </div>
                   <div class="detail-item">
                     <label>Gender:</label>
                     <span>{{ selectedConsultation.patientData?.gender || 'Not specified' }}</span>
                   </div>
                   <div class="detail-item">
                     <label>Occupation:</label>
                     <span>{{ selectedConsultation.patientData?.occupation || 'Not specified' }}</span>
                   </div>
                   <div class="detail-item full-width">
                     <label>Address:</label>
                     <span>{{ selectedConsultation.patientData?.address || 'Not specified' }}</span>
                   </div>
                 </div>
               </div>
               
               <div class="detail-section">
                 <h4><i class="fas fa-notes-medical"></i> Findings</h4>
                 <div class="detail-grid">
                   <div class="detail-item full-width">
                     <label>Chief Complaint:</label>
                     <p>{{ selectedConsultation.findings?.chiefComplaint || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Present Illness:</label>
                     <p>{{ selectedConsultation.findings?.presentIllness || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Past Illnesses:</label>
                     <p>{{ selectedConsultation.findings?.pastIllness || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Allergies:</label>
                     <p>{{ selectedConsultation.findings?.allergies || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Medications:</label>
                     <p>{{ selectedConsultation.findings?.medications || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Previous Surgeries:</label>
                     <p>{{ selectedConsultation.findings?.previousSurgeries || 'Not specified' }}</p>
                   </div>
                 </div>
               </div>

               <div class="detail-section">
                 <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                 <div class="detail-grid">
                   <div class="detail-item full-width">
                     <label>Treatment Plan:</label>
                     <p>{{ selectedConsultation.recommendations?.treatmentPlan || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Follow-up Instructions:</label>
                     <p>{{ selectedConsultation.recommendations?.followUpInstructions || 'Not specified' }}</p>
                   </div>
                   <div class="detail-item full-width">
                     <label>Additional Notes:</label>
                     <p>{{ selectedConsultation.recommendations?.additionalNotes || 'Not specified' }}</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

       <!-- Teacher Selection Modal -->
       <div v-if="showTeacherSelectionModal" class="modal-overlay" @click="closeTeacherSelectionModal">
         <div class="modal-content teacher-selection-modal" @click.stop>
           <div class="modal-header">
             <h3>
               <i class="fas fa-user-graduate"></i>
               Select Teacher
             </h3>
             <button class="close-btn" @click="closeTeacherSelectionModal">
               <i class="fas fa-times"></i>
             </button>
           </div>
           <div class="modal-body">
             <div v-if="isLoadingTeachers" class="loading-state">
               <i class="fas fa-spinner fa-spin"></i>
               <span>Loading teachers...</span>
             </div>
             <div v-else class="teacher-list">
               <p class="selection-instruction">Please select a teacher to send your consultation to:</p>
               <div class="teacher-options">
                 <div 
                   v-for="teacher in assignedTeachers" 
                   :key="teacher.teacherId"
                   class="teacher-option"
                   @click="selectTeacher(teacher)"
                 >
                   <div class="teacher-info">
                     <i class="fas fa-user-tie"></i>
                     <span class="teacher-name">{{ teacher.teacherName }}</span>
                   </div>
                   <div class="teacher-meta">
                     <small>Assigned: {{ new Date(teacher.assignedAt).toLocaleDateString() }}</small>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

       <!-- Questionnaire Modal -->
       <div v-if="showQuestionnaireModal" class="modal-overlay" @click="closeQuestionnaireModal">
         <div class="modal-content questionnaire-modal" @click.stop>
           <div class="modal-header">
             <h3>
               <i class="fas fa-clipboard-list"></i>
               Submit to Teacher - Questionnaire
             </h3>
             <button class="close-btn" @click="closeQuestionnaireModal">
               <i class="fas fa-times"></i>
             </button>
           </div>
           <div class="modal-body">
             <div class="questionnaire-form">
               <div v-for="(question, index) in questionnaireQuestions" :key="index" class="question-section">
                 <label :for="`question-${index}`" class="question-label">
                   {{ index + 1 }}. {{ question }}
                 </label>
                 <textarea
                   :id="`question-${index}`"
                   v-model="questionnaireAnswers[index]"
                   class="question-textarea"
                   :placeholder="`Please provide your answer for question ${index + 1}...`"
                   rows="4"
                   required
                 ></textarea>
               </div>
               
               <div class="questionnaire-actions">
                 <button class="submit-questionnaire-btn" @click="submitToTeacher" :disabled="!areAllQuestionsAnswered || isSubmitting">
                   <i class="fas fa-paper-plane"></i>
                   <span v-if="isSubmitting">Submitting...</span>
                   <span v-else>Submit to Teacher</span>
                 </button>
                 <button class="cancel-btn" @click="closeQuestionnaireModal" :disabled="isSubmitting">
                   <i class="fas fa-times"></i>
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>

       <!-- Status Modal -->
       <div v-if="showStatusModal" class="modal-overlay" @click="closeStatusModal">
         <div class="modal-content status-modal" @click.stop>
           <div class="modal-header">
             <h3>
               <i class="fas fa-clipboard-check"></i>
               Submission Status
             </h3>
             <button class="close-btn" @click="closeStatusModal">
               <i class="fas fa-times"></i>
             </button>
           </div>
           <div class="modal-body">
             <div v-if="submissionStatus" class="status-content">
               <div class="status-header">
                 <div class="status-badge" :class="submissionStatus.status">
                   <i class="fas" :class="{
                     'fa-clock': submissionStatus.status === 'submitted',
                     'fa-eye': submissionStatus.status === 'under_review',
                     'fa-check-circle': submissionStatus.status === 'reviewed',
                     'fa-edit': submissionStatus.status === 'revision_requested'
                   }"></i>
                   <span>{{ getStatusText(submissionStatus.status) }}</span>
                 </div>
               </div>
               
               <div class="status-details">
                 <div class="detail-item">
                   <label>Teacher:</label>
                   <span>{{ submissionStatus.teacherName }}</span>
                 </div>
                 <div class="detail-item">
                   <label>Submitted:</label>
                   <span>{{ formatDate(submissionStatus.submittedAt) }}</span>
                 </div>
                 <div v-if="submissionStatus.reviewedAt" class="detail-item">
                   <label>Reviewed:</label>
                   <span>{{ formatDate(submissionStatus.reviewedAt) }}</span>
                 </div>
                 <div v-if="submissionStatus.score" class="detail-item">
                   <label>Score:</label>
                   <span class="score">{{ submissionStatus.score }}/100</span>
                 </div>
                 <div v-if="submissionStatus.feedback" class="detail-item feedback">
                   <label>Teacher Feedback:</label>
                   <div class="feedback-content">{{ submissionStatus.feedback }}</div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

       <!-- Submit Success Notification -->
       <div v-if="showSubmitNotification" class="sticky-note-notification" :class="{ 'show': showSubmitNotification }">
         <div class="sticky-note success">
           <div class="sticky-note-header">
             <i class="fas fa-check-circle"></i>
             <span>Submitted to Teacher!</span>
           </div>
           <div class="sticky-note-body">
             Your consultation has been successfully submitted to your teacher for review.
           </div>
         </div>
       </div>
      </main>
  </div>
</template>

<script>
import axios from 'axios';
import { auth } from '../firebase/init';
import { onAuthStateChanged } from 'firebase/auth';

// API configuration
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

export default {
  name: 'AIPatient',
  data() {
    return {
      currentUser: null,
      currentUserId: null,
      sessionStarted: false,
      messages: [],
      currentMessage: '',
      messageIdCounter: 1,
      consultationNotes: {
        findings: '',
        recommendations: ''
      },
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
      showSaveNotification: false,
      showConsultationHistory: false,
      showConsultationDetails: false,
      selectedConsultation: null,
      consultationHistory: [],
      patientResponses: [
        "I've been having this pain in my chest for the past few days.",
        "It feels like a sharp pain, especially when I breathe deeply.",
        "The pain started after I was doing some heavy lifting at work.",
        "It's worse in the morning and gets better throughout the day.",
        "I haven't taken any medication for it yet.",
        "No, I don't have any other symptoms like fever or nausea.",
        "I'm a bit worried it might be something serious.",
        "The pain is about a 6 out of 10 in intensity.",
        "I work in construction, so I do a lot of physical labor.",
        "I don't smoke, but I do drink coffee regularly.",
        "I haven't had any recent injuries that I can remember.",
        "Should I be concerned about this pain?",
        "What do you think could be causing this?",
        "Do I need to see a doctor right away?"
      ],
      responseIndex: 0,
      // AI Integration properties
      isAiEnabled: true,
      isGeneratingResponse: false,
      aiError: null,
      speechEnabled: true,
      // Voice message playback state
      currentPlayingMessageId: null,
      isVoicePlaying: false,
      currentUtterance: null,
      // Random patient details
      randomPatientProfile: null,
      // Questionnaire properties
      showQuestionnaireModal: false,
      questionnaireQuestions: [
        'What are the primary symptoms observed in this patient?',
        'What is your nursing assessment and clinical findings?',
        'What care plan would you recommend for this patient?'
      ],
      questionnaireAnswers: ['', '', ''],
      isSubmitting: false,
      showSubmitNotification: false,
      hasAssignedTeacher: false,
      assignedTeacher: null,
      // Teacher selection properties
      showTeacherSelectionModal: false,
      assignedTeachers: [],
      selectedTeacher: null,
      isLoadingTeachers: false,
      // Status tracking properties
      showStatusButton: false,
      showStatusModal: false,
      submissionStatus: null,
      lastSubmissionId: null
    }
  },
  computed: {
    isFormValid() {
      return this.consultationData.patientName.trim() !== '' &&
             this.consultationData.chiefComplaint.trim() !== '' &&
             this.consultationData.treatmentPlan.trim() !== '';
    },
    areAllQuestionsAnswered() {
      return this.questionnaireAnswers.every(answer => answer.trim() !== '');
    }
  },
  mounted() {
    // Don't auto-start the chat anymore
    this.initializeEmptyChat();
    // Set up user authentication
    this.setupAuthentication();
    // Generate random patient profile
    this.generateRandomPatientProfile();
    // Initialize speech synthesis voices
    this.initializeVoices();
  },
  methods: {
    initializeEmptyChat() {
      // Initialize with empty messages array
      this.messages = [];
      this.responseIndex = 0;
      this.sessionStarted = false;
    },

    setupAuthentication() {
      // Set up Firebase Auth state listener
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUser = user;
          this.currentUserId = user.uid;
        } else {
          this.currentUser = null;
          this.currentUserId = null;
        }
      });
    },

    initializeVoices() {
      // Initialize speech synthesis voices early
      if ('speechSynthesis' in window) {
        // Trigger voice loading
        window.speechSynthesis.getVoices();
        
        // Set up voice loading listener
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log('Voices loaded:', voices.length, 'voices available');
          console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
        };
        
        if (window.speechSynthesis.getVoices().length > 0) {
          loadVoices();
        } else {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        }
      }
    },

    generateRandomPatientProfile() {
      const maleNames = [
        'James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Thomas', 'Christopher', 'Daniel',
        'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin'
      ];
      
      const femaleNames = [
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
        'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'
      ];
      
      const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
      ];
      
      const occupations = [
        'Teacher', 'Engineer', 'Nurse', 'Accountant', 'Sales Representative', 'Manager', 'Technician', 'Clerk',
        'Construction Worker', 'Chef', 'Driver', 'Mechanic', 'Artist', 'Writer', 'Consultant', 'Analyst',
        'Pharmacist', 'Therapist', 'Electrician', 'Plumber', 'Carpenter', 'Retail Worker', 'Security Guard',
        'Janitor', 'Waiter', 'Barista', 'Cashier', 'Receptionist', 'Administrator', 'Coordinator'
      ];
      
      // Randomly choose gender
      const gender = Math.random() < 0.5 ? 'Male' : 'Female';
      const names = gender === 'Male' ? maleNames : femaleNames;
      
      // Generate random details
      const firstName = names[Math.floor(Math.random() * names.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const age = Math.floor(Math.random() * (80 - 18 + 1)) + 18; // Age between 18-80
      const occupation = occupations[Math.floor(Math.random() * occupations.length)];
      
      // Generate random birth date based on age
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-specific issues
      const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
      
      this.randomPatientProfile = {
        name: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        age: age,
        dateOfBirth: dateOfBirth,
        occupation: occupation
      };
      
      // Update consultation data with random profile
      this.consultationData.patientName = this.randomPatientProfile.name;
      this.consultationData.dateOfBirth = this.randomPatientProfile.dateOfBirth;
      this.consultationData.gender = this.randomPatientProfile.gender;
      this.consultationData.occupation = this.randomPatientProfile.occupation;
    },
    
    startSession() {
       // Start the session and add initial patient message
       this.sessionStarted = true;
       const initialText = "Hello, I'm not feeling well right now. I've been experiencing some discomfort and I'm hoping you can help me understand what might be going on.";
       this.messages = [{
         id: this.messageIdCounter++,
         sender: 'patient',
         text: initialText,
         time: this.getCurrentTime(),
         duration: this.calculateSpeechDuration(initialText)
       }];
       this.responseIndex = 0;
       
       // Scroll to bottom after message is added
       this.$nextTick(() => {
         this.scrollToBottom();
       });
     },
    
    initializeChat() {
      // This method is now used only for reset functionality
      this.startSession();
    },
    
    sendMessage() {
      if (!this.currentMessage.trim()) return;
      
      // Add student message
      this.messages.push({
        id: this.messageIdCounter++,
        sender: 'student',
        text: this.currentMessage,
        time: this.getCurrentTime()
      });
      
      // Clear input
      this.currentMessage = '';
      
      // Simulate AI patient response after a short delay
      setTimeout(() => {
        this.generatePatientResponse();
      }, 1000);
      
      // Scroll to bottom
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    generateFallbackResponse() {
      if (this.responseIndex < this.patientResponses.length) {
        const response = this.patientResponses[this.responseIndex];
        this.messages.push({
          id: this.messageIdCounter++,
          sender: 'patient',
          text: response,
          time: this.getCurrentTime(),
          duration: this.calculateSpeechDuration(response)
        });
        this.responseIndex++;
      } else {
        // Default responses when we run out of predefined ones
        const defaultResponses = [
          "I see, that's helpful to know.",
          "Thank you for asking about that.",
          "I appreciate your concern.",
          "That makes sense to me.",
          "I'll keep that in mind."
        ];
        const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        this.messages.push({
          id: this.messageIdCounter++,
          sender: 'patient',
          text: randomResponse,
          time: this.getCurrentTime(),
          duration: this.calculateSpeechDuration(randomResponse)
        });
      }
      
      // Scroll to bottom
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },



    toggleSpeech() {
      this.speechEnabled = !this.speechEnabled;
    },

    toggleAI() {
      this.isAiEnabled = !this.isAiEnabled;
    },
    
    async generatePatientResponse() {
      this.isGeneratingResponse = true;
      this.aiError = null;

      try {
        // Get the last user message
        const lastMessage = this.messages[this.messages.length - 1];
        
        // Prepare patient context
        const patientContext = {
          patientData: {
            name: this.consultationData.patientName || 'Patient',
            dateOfBirth: this.consultationData.dateOfBirth,
            gender: this.consultationData.gender,
            occupation: this.consultationData.occupation
          },
          findings: {
            chiefComplaint: this.consultationData.chiefComplaint,
            presentIllness: this.consultationData.presentIllness,
            pastIllnesses: this.consultationData.pastIllness,
            allergies: this.consultationData.allergies,
            medications: this.consultationData.medications
          }
        };

        // Prepare conversation history (last 10 messages for context)
        const conversationHistory = this.messages.slice(-10).map(msg => ({
          sender: msg.sender === 'student' ? 'nurse' : 'patient',
          message: msg.text
        }));

        // Call AI backend for response generation and speech
        const response = await fetch(`${API_BASE_URL}/ai/chat-with-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: lastMessage.text,
            patientContext: patientContext,
            conversationHistory: conversationHistory,
            includeAudio: this.speechEnabled
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to generate response');
        }

        // Add AI response to messages
        const messageId = this.messageIdCounter++;
        this.messages.push({
          id: messageId,
          sender: 'patient',
          text: data.response,
          time: this.getCurrentTime(),
          duration: this.calculateSpeechDuration(data.response)
        });

        // Handle audio playback with browser speech synthesis
        if (this.speechEnabled) {
          this.speakTextWithBrowser(data.response);
        }

      } catch (error) {
        console.error('Error generating AI response:', error);
        this.aiError = error.message;
        
        // Fallback to predefined responses
        this.generateFallbackResponse();
      } finally {
        this.isGeneratingResponse = false;
      }
      
      // Scroll to bottom
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    resetChat() {
      if (confirm('Are you sure you want to reset the chat session?')) {
        this.initializeEmptyChat();
        this.clearNotes();
      }
    },
    
    saveNotes() {
      // In a real application, this would save to a database
      console.log('Saving consultation notes:', this.consultationNotes);
      
      // Show success feedback
      alert('Consultation notes saved successfully!');
    },
    
    clearNotes() {
      this.consultationNotes.findings = '';
      this.consultationNotes.recommendations = '';
    },
    
    clearNotesWithConfirmation() {
      if (confirm('Are you sure you want to clear all notes?')) {
        this.clearNotes();
      }
    },
    
    getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },

    async saveConsultationForm() {
      try {
        // Validate user authentication
        if (!this.currentUserId) {
          alert('You must be logged in to save consultations.');
          return;
        }

        // Validate required fields
        if (!this.consultationData.chiefComplaint.trim()) {
          alert('Please enter a Chief Complaint before saving.');
          return;
        }

        // Prepare data for saving
        const consultationPayload = {
          userId: this.currentUserId, // Add user ID for privacy
          patientName: this.consultationData.patientName || 'Unknown Patient',
          patientData: {
            name: this.consultationData.patientName || '',
            dateOfBirth: this.consultationData.dateOfBirth || '',
            gender: this.consultationData.gender || '',
            occupation: this.consultationData.occupation || '',
            address: this.consultationData.address || ''
          },
          findings: {
            chiefComplaint: this.consultationData.chiefComplaint,
            presentIllness: this.consultationData.presentIllness,
            pastIllness: this.consultationData.pastIllness,
            allergies: this.consultationData.allergies,
            medications: this.consultationData.medications,
            previousSurgeries: this.consultationData.previousSurgeries
          },
          recommendations: {
            treatmentPlan: this.consultationData.treatmentPlan,
            followUpInstructions: this.consultationData.followUpInstructions,
            additionalNotes: this.consultationData.additionalNotes
          }
        };

        // Save to database
        const response = await axios.post(`${API_BASE_URL}/consultations/save`, consultationPayload);
        
        if (response.data.success) {
          console.log('Consultation saved successfully:', response.data);
          
          // Show success notification
          this.showSaveNotification = true;
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            this.showSaveNotification = false;
          }, 3000);
        }
      } catch (error) {
        console.error('Error saving consultation:', error);
        alert('Failed to save consultation. Please try again.');
      }
    },

    clearConsultationForm() {
       if (confirm('Are you sure you want to clear all form data?')) {
         // Reset all consultation data
         this.consultationData = {
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
         };
       }
     },

     closeHistoryModal() {
       this.showConsultationHistory = false;
     },

     async fetchConsultationHistory() {
       try {
         // Validate user authentication
         if (!this.currentUserId) {
           console.error('User not authenticated');
           this.consultationHistory = [];
           return;
         }

         const response = await axios.get(`${API_BASE_URL}/consultations/history?userId=${this.currentUserId}`);
         if (response.data.success) {
           this.consultationHistory = response.data.consultations;
         }
       } catch (error) {
         console.error('Error fetching consultation history:', error);
         // Keep existing sample data if fetch fails
       }
     },

     closeDetailsModal() {
       this.showConsultationDetails = false;
       this.selectedConsultation = null;
     },

     viewConsultationDetails(consultation) {
       this.selectedConsultation = consultation;
       this.showConsultationDetails = true;
       this.showConsultationHistory = false;
     },

     formatDate(date) {
       if (!date) return 'N/A';
       
       // Handle Firestore timestamp with toDate method
       if (date && typeof date.toDate === 'function') {
         return date.toDate().toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric'
         });
       }
       
       // Handle Firestore timestamp object with _seconds property
       if (date && date._seconds) {
         const dateObj = new Date(date._seconds * 1000);
         return dateObj.toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric'
         });
       }
       
       // Handle regular date
       const dateObj = new Date(date);
       if (isNaN(dateObj.getTime())) return 'Invalid Date';
       
       return dateObj.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
       });
     },

     formatTime(date) {
       if (!date) return 'N/A';
       
       // Handle Firestore timestamp with toDate method
       if (date && typeof date.toDate === 'function') {
         return date.toDate().toLocaleTimeString('en-US', {
           hour: '2-digit',
           minute: '2-digit'
         });
       }
       
       // Handle Firestore timestamp object with _seconds property
       if (date && date._seconds) {
         const dateObj = new Date(date._seconds * 1000);
         return dateObj.toLocaleTimeString('en-US', {
           hour: '2-digit',
           minute: '2-digit'
         });
       }
       
       // Handle regular date
       const dateObj = new Date(date);
       if (isNaN(dateObj.getTime())) return 'Invalid Time';
       
       return dateObj.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit'
       });
     },

     // Browser-based speech synthesis fallback
     speakTextWithBrowser(text, options = {}) {
       if (!('speechSynthesis' in window)) {
         console.warn('Speech synthesis not supported in this browser');
         return;
       }

       // Stop any ongoing speech
       window.speechSynthesis.cancel();

       const utterance = new SpeechSynthesisUtterance(text);
       
       // Configure voice settings
       utterance.rate = options.rate || 0.9;
       utterance.pitch = options.pitch || 1.0;
       utterance.volume = options.volume || 0.8;
       
       // Function to select voice based on gender
       const selectVoiceByGender = () => {
         const voices = window.speechSynthesis.getVoices();
         console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, gender: v.name })));
         
         if (voices.length === 0) {
           console.warn('No voices available');
           return null;
         }

         let selectedVoice = null;
         const patientGender = this.randomPatientProfile?.gender;
         console.log('Patient gender:', patientGender);
         
         if (patientGender === 'Female') {
           // Enhanced female voice detection
           const femaleKeywords = [
             'female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'cortana', 'siri',
             'eva', 'anna', 'emma', 'sophia', 'olivia', 'ava', 'isabella', 'mia',
             'aria', 'elena', 'kate', 'sarah', 'maria', 'linda', 'karen', 'nancy',
             'helen', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura',
             'emily', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen'
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
                voice.name.toLowerCase().includes('hazel'))
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
               !voice.name.toLowerCase().includes('michael')
             );
             
             // Pick the second voice if available (often female)
             selectedVoice = englishVoices.length > 1 ? englishVoices[1] : englishVoices[0];
           }
           
         } else if (patientGender === 'Male') {
           // Enhanced male voice detection
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
                voice.name.toLowerCase().includes('mark'))
             );
           }
           
           // Third try: filter by language and pick male-sounding names
           if (!selectedVoice) {
             const englishVoices = voices.filter(voice => 
               voice.lang.startsWith('en') && 
               !voice.name.toLowerCase().includes('female') &&
               !voice.name.toLowerCase().includes('woman')
             );
             
             // Pick the first voice (often male by default)
             selectedVoice = englishVoices[0];
           }
         }
         
         // Final fallback: use first available English voice
         if (!selectedVoice) {
           selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
         }
         
         console.log('Selected voice:', selectedVoice?.name, 'for gender:', patientGender);
         return selectedVoice;
       };

       // Try to select voice immediately
       let selectedVoice = selectVoiceByGender();
       
       if (selectedVoice) {
         utterance.voice = selectedVoice;
       } else {
         // If no voices loaded yet, wait for them to load
         const voicesChangedHandler = () => {
           selectedVoice = selectVoiceByGender();
           if (selectedVoice) {
             utterance.voice = selectedVoice;
           }
           window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
         };
         
         window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
         
         // Fallback timeout in case voiceschanged doesn't fire
         setTimeout(() => {
           if (!selectedVoice) {
             const voices = window.speechSynthesis.getVoices();
             if (voices.length > 0) {
               utterance.voice = voices[0];
             }
           }
           window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
         }, 1000);
       }

       // Error handling
       utterance.onerror = (event) => {
         console.error('Speech synthesis error:', event.error);
       };

       utterance.onend = () => {
         console.log('Speech synthesis completed');
       };

       // Speak the text
       window.speechSynthesis.speak(utterance);
     },

     // Method to handle voice message playback
     playVoiceMessage(text) {
       // Use the existing speech synthesis functionality
       this.speakTextWithBrowser(text);
     },

     // Method to toggle voice message play/pause
     toggleVoiceMessage(messageId, text) {
       // If this message is currently playing, pause it
       if (this.currentPlayingMessageId === messageId && this.isVoicePlaying) {
         this.pauseVoiceMessage();
       } 
       // If this message is paused, resume it
       else if (this.currentPlayingMessageId === messageId && !this.isVoicePlaying) {
         this.resumeVoiceMessage();
       }
       // If no message is playing or a different message is playing, start this one
       else {
         this.playNewVoiceMessage(messageId, text);
       }
     },

     // Method to play a new voice message
     playNewVoiceMessage(messageId, text) {
       // Stop any currently playing message
       this.stopVoiceMessage();
       
       // Set the current playing message
       this.currentPlayingMessageId = messageId;
       this.isVoicePlaying = true;
       
       // Start playing the new message
       this.speakTextWithBrowserControlled(text);
     },

     // Method to pause the current voice message
     pauseVoiceMessage() {
       if (window.speechSynthesis && this.isVoicePlaying) {
         window.speechSynthesis.pause();
         this.isVoicePlaying = false;
       }
     },

     // Method to resume the current voice message
     resumeVoiceMessage() {
       if (window.speechSynthesis && !this.isVoicePlaying) {
         window.speechSynthesis.resume();
         this.isVoicePlaying = true;
       }
     },

     // Method to stop the current voice message
     stopVoiceMessage() {
       if (window.speechSynthesis) {
         window.speechSynthesis.cancel();
       }
       this.currentPlayingMessageId = null;
       this.isVoicePlaying = false;
       this.currentUtterance = null;
     },

     // Enhanced speech synthesis with proper state management
     speakTextWithBrowserControlled(text, options = {}) {
       if (!('speechSynthesis' in window)) {
         console.warn('Speech synthesis not supported in this browser');
         return;
       }

       // Stop any ongoing speech
       window.speechSynthesis.cancel();

       const utterance = new SpeechSynthesisUtterance(text);
       this.currentUtterance = utterance;
       
       // Configure voice settings
       utterance.rate = options.rate || 0.9;
       utterance.pitch = options.pitch || 1.0;
       utterance.volume = options.volume || 0.8;
       
       // Handle utterance events
       utterance.onstart = () => {
         this.isVoicePlaying = true;
       };

       utterance.onend = () => {
         this.currentPlayingMessageId = null;
         this.isVoicePlaying = false;
         this.currentUtterance = null;
       };

       utterance.onerror = (event) => {
         console.error('Speech synthesis error:', event.error);
         this.currentPlayingMessageId = null;
         this.isVoicePlaying = false;
         this.currentUtterance = null;
       };

       utterance.onpause = () => {
         this.isVoicePlaying = false;
       };

       utterance.onresume = () => {
         this.isVoicePlaying = true;
       };

       // Set voice based on patient gender (reuse existing logic)
       this.setVoiceForUtterance(utterance);

       // Speak the text
       window.speechSynthesis.speak(utterance);
     },

     // Helper method to set voice for utterance
     setVoiceForUtterance(utterance) {
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
       const patientGender = this.randomPatientProfile?.gender;
       
       if (patientGender === 'Female') {
         const femaleKeywords = [
           'female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'cortana', 'siri'
         ];
         selectedVoice = voices.find(voice => 
           femaleKeywords.some(keyword => 
             voice.name.toLowerCase().includes(keyword)
           )
         );
       } else if (patientGender === 'Male') {
         const maleKeywords = [
           'male', 'man', 'david', 'mark', 'alex', 'daniel', 'james', 'john', 'michael'
         ];
         selectedVoice = voices.find(voice => 
           maleKeywords.some(keyword => 
             voice.name.toLowerCase().includes(keyword)
           )
         );
       }

       // Fallback to default voice if no gender-specific voice found
       if (!selectedVoice && voices.length > 0) {
         selectedVoice = voices[0];
       }

       if (selectedVoice) {
         utterance.voice = selectedVoice;
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

     // Questionnaire methods
     async checkToTeacher() {
       if (!this.currentUserId) {
         alert('You must be logged in to submit to teacher.');
         return;
       }

       if (!this.isFormValid) {
         alert('Please fill in all required fields before submitting to teacher.');
         return;
       }

       try {
         this.isLoadingTeachers = true;
         
         // Get all assigned teachers for this student
         const response = await axios.get(`${API_BASE_URL}/consultations/assigned-teachers/${this.currentUserId}`);
         
         if (!response.data.hasTeachers || response.data.teachers.length === 0) {
           alert('You are not assigned to any teacher. Please contact your instructor to get assigned.');
           return;
         }

         this.assignedTeachers = response.data.teachers;
         this.hasAssignedTeacher = true;

         // If only one teacher, auto-select and proceed to questionnaire
         if (this.assignedTeachers.length === 1) {
           this.selectedTeacher = this.assignedTeachers[0];
           await this.proceedToQuestionnaire();
         } else {
           // Show teacher selection modal
           this.showTeacherSelectionModal = true;
         }
       } catch (error) {
         console.error('Error checking teacher assignment:', error);
         alert('Failed to check teacher assignment. Please try again.');
       } finally {
         this.isLoadingTeachers = false;
       }
     },

     async proceedToQuestionnaire() {
       try {
         // Load questionnaire template
         await this.loadQuestionnaireTemplate();
         
         // Close teacher selection modal and show questionnaire modal
         this.showTeacherSelectionModal = false;
         this.showQuestionnaireModal = true;
       } catch (error) {
         console.error('Error proceeding to questionnaire:', error);
         alert('Failed to load questionnaire. Please try again.');
       }
     },

     selectTeacher(teacher) {
       this.selectedTeacher = teacher;
     },

     closeTeacherSelectionModal() {
       this.showTeacherSelectionModal = false;
       this.selectedTeacher = null;
     },

     async loadQuestionnaireTemplate() {
       try {
         const response = await axios.get(`${API_BASE_URL}/consultations/template/${this.currentUserId}`);
         
         if (response.data.success && response.data.template.questions) {
           this.questionnaireQuestions = response.data.template.questions;
           // Reset answers array to match questions length
           this.questionnaireAnswers = new Array(this.questionnaireQuestions.length).fill('');
         }
       } catch (error) {
         console.error('Error loading questionnaire template:', error);
         // Use default questions if template loading fails
         this.questionnaireQuestions = [
           'What are the primary symptoms observed in this patient?',
           'What is your nursing assessment and clinical findings?',
           'What care plan would you recommend for this patient?'
         ];
         this.questionnaireAnswers = ['', '', ''];
       }
     },

     closeQuestionnaireModal() {
       this.showQuestionnaireModal = false;
       // Reset questionnaire answers
       this.questionnaireAnswers = new Array(this.questionnaireQuestions.length).fill('');
     },

     async submitToTeacher() {
       if (!this.areAllQuestionsAnswered) {
         alert('Please answer all questions before submitting.');
         return;
       }

       this.isSubmitting = true;

       try {
         // Prepare consultation data
         const consultationData = {
           userId: this.currentUserId,
           patientName: this.consultationData.patientName,
           patientData: {
             dateOfBirth: this.consultationData.dateOfBirth,
             gender: this.consultationData.gender,
             occupation: this.consultationData.occupation,
             address: this.consultationData.address
           },
           findings: {
             chiefComplaint: this.consultationData.chiefComplaint,
             presentIllness: this.consultationData.presentIllness,
             pastIllness: this.consultationData.pastIllness,
             allergies: this.consultationData.allergies,
             medications: this.consultationData.medications,
             previousSurgeries: this.consultationData.previousSurgeries
           },
           recommendations: {
             treatmentPlan: this.consultationData.treatmentPlan,
             followUpInstructions: this.consultationData.followUpInstructions,
             additionalNotes: this.consultationData.additionalNotes
           }
         };

         // Prepare questionnaire data
         const questionnaireData = {
           questions: this.questionnaireQuestions,
           answers: this.questionnaireAnswers
         };

         // Submit to teacher with selected teacher ID
         const response = await axios.post(`${API_BASE_URL}/consultations/submit-to-teacher`, {
           consultationData,
           questionnaireData,
           selectedTeacherId: this.selectedTeacher.teacherId
         });

         if (response.data.success) {
           // Store submission info for status tracking
           this.lastSubmissionId = response.data.submissionId;
           this.submissionStatus = {
             teacherName: this.selectedTeacher.teacherName,
             submittedAt: new Date(),
             status: 'submitted'
           };
           
           // Close modal
           this.closeQuestionnaireModal();
           
           // Show success notification
           this.showSubmitNotification = true;
           setTimeout(() => {
             this.showSubmitNotification = false;
           }, 4000);

           // Show status button
           this.showStatusButton = true;

           // Clear form after successful submission
           this.clearConsultationForm();
         } else {
           alert(response.data.message || 'Failed to submit consultation to teacher.');
         }
       } catch (error) {
         console.error('Error submitting to teacher:', error);
         if (error.response && error.response.data && error.response.data.message) {
           alert(error.response.data.message);
         } else {
           alert('Failed to submit consultation to teacher. Please try again.');
         }
       } finally {
         this.isSubmitting = false;
       }
     },

     // Status-related methods
     showStatus() {
       this.showStatusModal = true;
       this.fetchSubmissionStatus();
     },

     closeStatusModal() {
       this.showStatusModal = false;
     },

     async fetchSubmissionStatus() {
       if (!this.lastSubmissionId) return;

       try {
         const response = await axios.get(`${API_BASE_URL}/consultations/submission-status/${this.lastSubmissionId}`);
         if (response.data.success) {
           this.submissionStatus = {
             ...this.submissionStatus,
             ...response.data.submission,
             status: response.data.submission.status || 'submitted'
           };
         }
       } catch (error) {
          console.error('Error fetching submission status:', error);
        }
      },

      getStatusText(status) {
        const statusMap = {
          'submitted': 'Submitted',
          'under_review': 'Under Review',
          'reviewed': 'Reviewed',
          'revision_requested': 'Revision Requested'
        };
        return statusMap[status] || 'Unknown';
      }
  }
}
</script>

<style scoped>
.ai-patient {
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.ai-patient-content {
  background: var(--bg-secondary);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.simulation-container {
  display: grid;
  grid-template-columns: 1fr 500px;
  min-height: 80vh;
}

/* Consultation Section Styles (Right Side) */
.consultation-section {
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-primary);
  overflow-y: auto;
}

.consultation-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.consultation-header h3 {
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.consultation-header h3 i {
  color: var(--accent-success);
}

.consultation-form {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.form-group:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
}

.section-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding: 0.5rem 0;
  border-bottom: 2px solid var(--accent-success);
  display: inline-block;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.form-input, .form-textarea {
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent-success);
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
  transform: translateY(-1px);
}

.form-input::placeholder, .form-textarea::placeholder {
  color: var(--text-secondary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.save-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.clear-btn {
  background: #f56565;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

.submit-teacher-btn {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.submit-teacher-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}

.submit-teacher-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Questionnaire Modal Styles */
.questionnaire-modal {
  max-width: 700px;
  width: 90%;
}

.questionnaire-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-primary);
}

.question-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.4;
}

.question-textarea {
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: var(--bg-primary);
  color: var(--text-primary);
  resize: vertical;
  min-height: 100px;
}

.question-textarea:focus {
  outline: none;
  border-color: var(--accent-success);
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

.question-textarea::placeholder {
  color: var(--text-secondary);
}

.questionnaire-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.submit-questionnaire-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.submit-questionnaire-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.submit-questionnaire-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: #718096;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.cancel-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(113, 128, 150, 0.4);
}

.cancel-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Success notification styles */
.sticky-note.success {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

/* Chat Section Styles (Left Side) */
.chat-section {
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.patient-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.patient-details h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.patient-status {
  color: var(--accent-success);
  font-size: 0.9rem;
  font-weight: 500;
}

.chat-controls .control-btn {
  background: var(--bg-button);
  color: var(--text-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.chat-controls .control-btn:hover {
  background: var(--bg-tertiary);
}

.chat-messages {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 60vh;
  background: var(--bg-primary);
}

.message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.patient-message .message-avatar {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

.student-message .message-avatar {
  background: linear-gradient(135deg, #4299e1, #3182ce);
}

.message-content {
  flex: 1;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sender-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.message-time {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.message-text {
  color: var(--text-primary);
  line-height: 1.5;
}

/* Voice Message Bubble Styles */
.voice-message-bubble {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 20px;
  padding: 12px 16px;
  max-width: 280px;
  border: 1px solid #90caf9;
}

.voice-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2196f3;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.play-button:hover {
  background: #1976d2;
  transform: scale(1.05);
}

/* Playing state styles */
.voice-message-bubble.playing {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-color: #81c784;
  animation: pulse-playing 2s infinite;
}

.voice-message-bubble.playing .play-button {
  background: #4caf50;
}

.voice-message-bubble.playing .play-button:hover {
  background: #388e3c;
}

@keyframes pulse-playing {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0.1);
  }
}

.play-button i {
  font-size: 12px;
  margin-left: 2px;
}

.voice-waveform {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
}

.waveform-bars .bar {
  width: 3px;
  background: #2196f3;
  border-radius: 2px;
  animation: waveform 1.5s ease-in-out infinite;
}

.waveform-bars .bar:nth-child(odd) {
  height: 8px;
}

.waveform-bars .bar:nth-child(even) {
  height: 12px;
}

.waveform-bars .bar:nth-child(3n) {
  height: 16px;
}

.waveform-bars .bar:nth-child(5n) {
  height: 6px;
}

@keyframes waveform {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1.5);
    opacity: 1;
  }
}

.waveform-bars .bar:nth-child(1) { animation-delay: 0s; }
.waveform-bars .bar:nth-child(2) { animation-delay: 0.1s; }
.waveform-bars .bar:nth-child(3) { animation-delay: 0.2s; }
.waveform-bars .bar:nth-child(4) { animation-delay: 0.3s; }
.waveform-bars .bar:nth-child(5) { animation-delay: 0.4s; }
.waveform-bars .bar:nth-child(6) { animation-delay: 0.5s; }
.waveform-bars .bar:nth-child(7) { animation-delay: 0.6s; }
.waveform-bars .bar:nth-child(8) { animation-delay: 0.7s; }
.waveform-bars .bar:nth-child(9) { animation-delay: 0.8s; }
.waveform-bars .bar:nth-child(10) { animation-delay: 0.9s; }
.waveform-bars .bar:nth-child(11) { animation-delay: 1s; }
.waveform-bars .bar:nth-child(12) { animation-delay: 1.1s; }
.waveform-bars .bar:nth-child(13) { animation-delay: 1.2s; }
.waveform-bars .bar:nth-child(14) { animation-delay: 1.3s; }
.waveform-bars .bar:nth-child(15) { animation-delay: 1.4s; }
.waveform-bars .bar:nth-child(16) { animation-delay: 0.2s; }
.waveform-bars .bar:nth-child(17) { animation-delay: 0.4s; }
.waveform-bars .bar:nth-child(18) { animation-delay: 0.6s; }
.waveform-bars .bar:nth-child(19) { animation-delay: 0.8s; }
.waveform-bars .bar:nth-child(20) { animation-delay: 1s; }

.voice-duration {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

/* Dark theme support for voice message bubble */
[data-theme="dark"] .voice-message-bubble {
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  border-color: #3b82f6;
}

[data-theme="dark"] .voice-duration {
  color: #cbd5e1;
}

/* AI Controls Section */
.ai-controls-section {
  padding: 1rem 1.5rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.ai-toggle, .speech-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  background-color: var(--bg-button);
  transition: 0.3s;
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
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-success);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-label {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
}

.ai-status-indicator {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-generating {
  color: #fbbf24;
  font-size: 0.9rem;
}

.status-error {
  color: #f87171;
  font-size: 0.9rem;
}

.status-ready {
  color: #48bb78;
  font-size: 0.9rem;
}

.status-disabled {
  color: #9ca3af;
  font-size: 0.9rem;
}

.chat-input-section {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
}

.input-container {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  transition: border-color 0.3s;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.message-input:focus {
  outline: none;
  border-color: var(--accent-success);
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

.message-input::placeholder {
  color: var(--text-secondary);
}

.send-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.3s;
  min-height: 60px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Welcome Message Styles */
.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  background: var(--bg-primary);
}

.welcome-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  font-size: 2rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.welcome-title {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.welcome-text {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

/* Start Session Button in Header */
.start-session-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); }
  to { box-shadow: 0 6px 20px rgba(72, 187, 120, 0.5); }
}

.start-session-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.5);
  background: linear-gradient(135deg, #38a169, #2f855a);
}

.start-session-btn i {
  font-size: 1.1rem;
}



.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
}

.save-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.3s;
  flex: 1;
  justify-content: center;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.clear-btn {
  background: #f56565;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.3s;
  flex: 1;
  justify-content: center;
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .simulation-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .consultation-section {
    border-left: none;
    border-top: 1px solid var(--border-primary);
    max-height: 400px;
  }
  
  .chat-messages {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .simulation-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: auto;
    min-height: 100vh;
  }
  
  .consultation-section {
    border-left: none;
    border-bottom: 1px solid var(--border-primary);
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .chat-header {
    padding: 1rem;
  }
  
  .patient-info {
    gap: 0.5rem;
  }
  
  .patient-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .input-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .send-btn {
    align-self: stretch;
  }
  
  .consultation-form {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .welcome-content {
    padding: 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.3rem;
  }
  
  .welcome-text {
    font-size: 0.9rem;
  }
  
  .start-session-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
  }
}

/* Sticky Note Notification Styles */
.sticky-note-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.sticky-note-notification.show {
  transform: translateX(0);
}

.sticky-note {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  position: relative;
  animation: stickyNoteFloat 0.6s ease-out;
}

.sticky-note::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 20px;
  width: 20px;
  height: 20px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sticky-note-header {
  padding: 1rem 1rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
}

.sticky-note-header i {
  color: #059669;
  font-size: 1.1rem;
}

.sticky-note-body {
  padding: 0 1rem 1rem;
  color: #78350f;
  font-size: 0.9rem;
  line-height: 1.4;
}

@keyframes stickyNoteFloat {
  0% {
    transform: translateY(-20px) rotate(-2deg);
    opacity: 0;
  }
  50% {
    transform: translateY(5px) rotate(1deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
}

/* Mobile responsive for sticky note */
@media (max-width: 768px) {
  .sticky-note-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    transform: translateY(-100%);
  }
  
  .sticky-note-notification.show {
    transform: translateY(0);
  }
  
  .sticky-note {
    min-width: auto;
    max-width: none;
  }
}

/* Modal Overlay Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

/* Modal Content Styles */
.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  max-width: 900px;
  width: 95%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: var(--accent-success);
}

.close-btn {
  background: #f56565;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e53e3e;
  transform: scale(1.05);
}

/* Modal Body */
.modal-body {
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

/* History Table Styles */
.history-table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.history-table th {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid var(--border-primary);
  font-size: 0.9rem;
}

.history-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-secondary);
}

.history-table tr:hover {
  background: var(--bg-secondary);
}

.history-table .no-data {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  font-style: italic;
}

.history-table .no-data i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.view-btn {
  background: #4299e1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
}

/* History Button in Header */
.history-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.history-btn:hover {
  background: #7eb988;
  transform: translateY(-1px);
}

/* Consultation Details Styles */
.details-modal {
  max-width: 1000px;
}

.consultation-details {
  color: #2d3748;
}

.detail-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h4 {
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding: 0.5rem 0;
  border-bottom: 2px solid #48bb78;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-section h4 i {
  color: #48bb78;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #48bb78;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #2d3748;
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-item span,
.detail-item p {
  color: #4a5568;
  line-height: 1.5;
  margin: 0;
}

/* Dark mode styles for consultation details */
[data-theme="dark"] .consultation-details {
  color: var(--text-primary);
}

[data-theme="dark"] .detail-section {
  border-bottom-color: var(--border-primary);
}

[data-theme="dark"] .detail-section h4 {
  color: var(--text-primary);
}

[data-theme="dark"] .detail-item {
  background: var(--bg-secondary);
  border-left-color: #48bb78;
}

[data-theme="dark"] .detail-item label {
  color: var(--text-primary);
}

[data-theme="dark"] .detail-item span,
[data-theme="dark"] .detail-item p {
  color: var(--text-secondary);
}

/* Mobile Responsive for Modals */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1rem 1.5rem;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 1.5rem;
    max-height: calc(90vh - 100px);
  }
  
  .history-table {
    font-size: 0.85rem;
  }
  
  .history-table th,
  .history-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .detail-item {
    padding: 0.75rem;
  }
  
  .view-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
    max-height: calc(100vh - 80px);
  }
  
  .history-table th,
  .history-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
}

/* Light mode specific styling for Reset Chat button */
[data-theme="light"] .chat-controls .control-btn {
  background: linear-gradient(135deg, rgb(72, 187, 120), rgb(56, 161, 105));
  color: white;
}

[data-theme="light"] .chat-controls .control-btn:hover {
  background: linear-gradient(135deg, rgb(56, 161, 105), rgb(47, 133, 90));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}
</style>