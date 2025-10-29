<template>
  <div class="room-interface">
    <!-- Header Section -->
    <div class="room-header">
      <div class="header-content">
        <div class="room-info">
          <h1 class="room-title">{{ displayRoomData.activityName }}</h1>
          <div class="room-meta">
            <span class="section-badge">{{ displayRoomData.section }}</span>
            <span class="mode-badge">{{ displayRoomData.mode }}</span>
            <span class="duration-badge" v-if="displayRoomData.duration">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ displayRoomData.duration }} min
            </span>
            <span class="module-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="currentColor" stroke-width="2"/>
                <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ displayRoomData.module }}
            </span>
            <span class="difficulty-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polygon points="12,2 15.09,8.26 22,9 17,14 18.18,21 12,17.77 5.82,21 7,14 2,9 8.91,8.26" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ displayRoomData.difficultyLevel }}
            </span>
          </div>
        </div>
        <div class="room-actions">
          <button 
            class="copy-code-btn" 
            @click="copyRoomCode"
            :disabled="isLoading"
          >
            <i class="fas fa-copy"></i>
            {{ isCopied ? 'Copied!' : 'Copy Code' }}
          </button>
          
          <button 
            v-if="!isAIPatientRoom"
            class="leaderboard-btn" 
            :class="{ active: showLeaderboardModal }"
            @click="toggleLeaderboard"
            :disabled="isLoading"
          >
            <i class="fas fa-trophy"></i>
            {{ showLeaderboardModal ? 'Hide' : 'Show' }} Leaderboard
          </button>
          
          <button 
            v-if="canStart"
            class="start-btn" 
            @click="startActivity"
            :disabled="isStartingActivity"
          >
            <i class="fas fa-play"></i>
            {{ isStartingActivity ? 'Starting...' : 'Start Activity' }}
          </button>

          <!-- Complete Activity Button / Mark as Done Button for AI Patient Room -->
          <button 
            v-if="hasActivityStarted"
            class="complete-btn" 
            @click="isAIPatientRoom ? markAsDone() : completeActivity()"
            :disabled="isCompletingActivity"
          >
            <i class="fas fa-check-circle"></i>
            {{ isCompletingActivity ? (isAIPatientRoom ? 'Marking...' : 'Completing...') : (isAIPatientRoom ? 'Mark as Done' : 'Complete Activity') }}
          </button>
          
          <button 
            v-if="!hasActivityStarted"
            class="end-btn" 
            @click="endRoom"
            :disabled="isEndingRoom"
          >
            <i class="fas fa-stop"></i>
            {{ isEndingRoom ? 'Ending...' : 'End Room' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Room Code Display -->
    <div class="room-code-section">
      <div class="room-code-container">
        <div class="code-label">Room Code</div>
        <div class="room-code">{{ roomCode }}</div>
        <div class="code-instruction">Share this code with your students</div>
      </div>
      <div class="qr-code-container">
        <div class="qr-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            <rect x="5" y="5" width="3" height="3" fill="currentColor"/>
            <rect x="16" y="5" width="3" height="3" fill="currentColor"/>
            <rect x="5" y="16" width="3" height="3" fill="currentColor"/>
            <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="qr-label">QR Code</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-content">
      <!-- Students List -->
      <div class="students-section">
        <div class="section-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M20 8V14L17 11L20 8Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Students Joined ({{ activeStudents.length }})
          </h3>
          <div class="student-counter">
            <span class="counter-text">{{ activeStudents.length }}/{{ maxStudents }}</span>
          </div>
        </div>
        
        <div class="students-grid">
          <div 
            v-for="(student, index) in activeStudents" 
            :key="student.id"
            class="student-card"
            :class="{ 'clickable-card': isAIPatientRoom, 'has-consultation': isAIPatientRoom && hasConsultationSubmitted(student) }"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="isAIPatientRoom ? openConsultationModal(student) : null"
          >
            <!-- Notification badge for AI Patient rooms -->
            <div v-if="isAIPatientRoom && hasConsultationSubmitted(student)" class="consultation-badge">
              <i class="fas fa-clipboard-check"></i>
            </div>
            
            <div class="student-avatar">
              <span>{{ student.studentName ? student.studentName.charAt(0) : '?' }}</span>
            </div>
            <div class="student-info">
              <div class="student-name">{{ student.studentName }}</div>
              <div class="student-status" :class="student.status">
                <div class="status-dot"></div>
                {{ student.status === 'ready' ? 'Ready' : 'Waiting' }}
              </div>
              <!-- AI Patient room specific info -->
              <div v-if="isAIPatientRoom" class="consultation-info">
                <span v-if="hasConsultationSubmitted(student)" class="consultation-status submitted">
                  <i class="fas fa-check-circle"></i> Form Submitted
                </span>
                <span v-else class="consultation-status pending">
                  <i class="fas fa-clock"></i> Awaiting Form
                </span>
              </div>
            </div>
            <div class="student-actions">              
              <button @click.stop="kickStudent(student)" class="kick-btn" title="Remove Student">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Empty slots -->
          <div 
            v-for="n in (maxStudents - activeStudents.length)" 
            :key="`empty-${n}`"
            class="student-card empty-slot"
          >
            <div class="empty-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2"/>
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="empty-text">Waiting for student...</div>
          </div>
        </div>
      </div>

      <!-- Live Leaderboard Modal (hidden for AI Patient rooms) -->
      <div v-if="activityStarted && showLeaderboard && !isAIPatientRoom" class="leaderboard-modal" @click="closeLeaderboard">
        <div class="leaderboard-modal-content" @click.stop>
          <div class="modal-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Live Leaderboard
            </h3>
            <button @click="closeLeaderboard" class="close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>

          <div class="leaderboard-content">
            <div class="leaderboard-list">
              <div 
                v-for="(student, index) in leaderboard" 
                :key="student.id"
                class="leaderboard-item"
                :class="{ 'top-three': index < 3 }"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="rank">
                  <span v-if="index < 3" class="medal">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                  </span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="student-avatar small">
                  <span>{{ student.studentName ? student.studentName.charAt(0) : '?' }}</span>
                </div>
                <div class="student-details">
                  <div class="name">{{ student.studentName }}</div>
                  <div class="progress">{{ student.progress }}% complete</div>
                </div>
                <div class="stats">
                  <div class="wpm">{{ student.wpm }} WPM</div>
                  <div class="accuracy">{{ student.accuracy }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else-if="toast.type === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <!-- Live Leaderboard Modal (hidden for AI Patient rooms) -->
    <LiveLeaderboardModal
      v-if="!isAIPatientRoom"
      :isVisible="showLeaderboardModal"
      :roomCode="roomCode"
      @close="showLeaderboardModal = false"
    />

    <!-- Complete Activity Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay" @click="closeConfirmationModal">
      <div class="confirmation-modal" @click.stop>
        <div class="modal-header">
          <h3>Complete Activity</h3>
          <button class="close-btn" @click="closeConfirmationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>Are you sure you want to complete this activity?</p>
          <p class="warning-text">This will end the session for all students and save their progress.</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeConfirmationModal">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button class="confirm-btn" @click="confirmCompleteActivity" :disabled="isCompletingActivity">
            <i class="fas fa-check"></i>
            {{ isCompletingActivity ? 'Completing...' : 'Complete Activity' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Start Activity Loading Modal -->
    <div v-if="showStartActivityModal" class="modal-overlay">
      <div class="loading-modal" @click.stop>
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3>Starting Activity...</h3>
          <p>Please wait while we prepare the activity for your students.</p>
        </div>
      </div>
    </div>

    <!-- Complete Activity Loading Modal -->
    <div v-if="showCompleteActivityModal" class="modal-overlay">
      <div class="loading-modal" @click.stop>
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3>Completing Activity...</h3>
          <p>Saving student progress and finalizing results.</p>
        </div>
      </div>
    </div>

    <!-- End Room Loading Modal -->
    <div v-if="showEndRoomModal" class="modal-overlay">
      <div class="loading-modal" @click.stop>
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3>Ending Room...</h3>
          <p>Closing the room and saving all data.</p>
        </div>
      </div>
    </div>

    <!-- Student Consultation Modal (AI Patient rooms only) -->
    <div v-if="showConsultationModal && isAIPatientRoom" class="modal-overlay" @click="closeConsultationModal">
      <div class="consultation-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-user-md"></i>
            {{ selectedStudent?.studentName }}'s Consultation Form
          </h3>
          <button class="close-btn" @click="closeConsultationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="isLoadingConsultation" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading consultation form...</span>
          </div>
          
          <div v-else-if="consultationError" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ consultationError }}</span>
          </div>
          
          <div v-else-if="!studentConsultation" class="no-consultation-state">
            <i class="fas fa-clipboard"></i>
            <h4>No Consultation Form Submitted</h4>
            <p>{{ selectedStudent?.studentName }} hasn't submitted their consultation form yet.</p>
          </div>
          
          <div v-else class="consultation-content">
            <!-- Patient Information Section -->
            <div class="consultation-section">
              <h4 class="section-title">
                <i class="fas fa-user"></i>
                Patient Information
              </h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Patient Name:</label>
                  <span>{{ studentConsultation.patientName || studentConsultation.patientData?.name || 'Not specified' }}</span>
                </div>
                <div class="info-item">
                  <label>Date of Birth:</label>
                  <span>{{ studentConsultation.patientData?.dateOfBirth || 'Not specified' }}</span>
                </div>
                <div class="info-item">
                  <label>Gender:</label>
                  <span>{{ studentConsultation.patientData?.gender || 'Not specified' }}</span>
                </div>
                <div class="info-item">
                  <label>Occupation:</label>
                  <span>{{ studentConsultation.patientData?.occupation || 'Not specified' }}</span>
                </div>
                <div class="info-item full-width">
                  <label>Address:</label>
                  <span>{{ studentConsultation.patientData?.address || 'Not specified' }}</span>
                </div>
              </div>
            </div>

            <!-- Findings Section -->
            <div class="consultation-section">
              <h4 class="section-title">
                <i class="fas fa-stethoscope"></i>
                Findings
              </h4>
              <div class="findings-content">
                <div class="finding-item">
                  <label>Chief Complaint:</label>
                  <p>{{ studentConsultation.findings?.chiefComplaint || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Present Illness:</label>
                  <p>{{ studentConsultation.findings?.presentIllness || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Past Illnesses:</label>
                  <p>{{ studentConsultation.findings?.pastIllness || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Allergies:</label>
                  <p>{{ formatAllergies(studentConsultation.findings?.allergies) }}</p>
                </div>
                <div class="finding-item">
                  <label>Medications:</label>
                  <p>{{ studentConsultation.findings?.medications || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Previous Surgeries:</label>
                  <p>{{ studentConsultation.findings?.previousSurgeries || 'Not specified' }}</p>
                </div>
              </div>
            </div>

            <!-- Recommendations Section -->
            <div class="consultation-section">
              <h4 class="section-title">
                <i class="fas fa-lightbulb"></i>
                Recommendations
              </h4>
              <div class="findings-content">
                <div class="finding-item">
                  <label>Treatment Plan:</label>
                  <p>{{ studentConsultation.recommendations?.treatmentPlan || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Follow-up Instructions:</label>
                  <p>{{ studentConsultation.recommendations?.followUpInstructions || 'Not specified' }}</p>
                </div>
                <div class="finding-item">
                  <label>Additional Notes:</label>
                  <p>{{ studentConsultation.recommendations?.additionalNotes || 'Not specified' }}</p>
                </div>
              </div>
            </div>

            <!-- AI Patient Conversation Section -->
            <div v-if="studentConsultation.conversationHistory && studentConsultation.conversationHistory.length > 0" class="consultation-section conversation-section">
              <h4 class="section-title">
                <i class="fas fa-comments"></i>
                AI Patient Conversation
              </h4>
              <div class="conversation-content">
                <div class="conversation-messages">
                  <div 
                    v-for="(message, index) in studentConsultation.conversationHistory" 
                    :key="index"
                    class="conversation-message"
                    :class="{ 'student-message': message.sender === 'student', 'ai-message': message.sender === 'patient' }"
                  >
                    <div class="message-header">
                      <span class="message-sender">
                        <i :class="message.sender === 'student' ? 'fas fa-user-graduate' : 'fas fa-robot'"></i>
                        {{ message.sender === 'student' ? 'Student' : 'AI Patient' }}
                      </span>
                      <span v-if="message.time" class="message-time">
                        {{ message.time }}
                      </span>
                    </div>
                    <div class="message-content">
                      {{ message.text }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Teacher Feedback Section -->
            <div class="consultation-section feedback-section">
              <h4 class="section-title">
                <i class="fas fa-comment-dots"></i>
                Teacher Feedback
              </h4>
              <div v-if="studentConsultation.teacherFeedback" class="existing-feedback">
                <div class="feedback-item">
                  <div class="feedback-header">
                    <span class="feedback-author">{{ studentConsultation.teacherFeedback.teacherName }}</span>
                    <span class="feedback-date">{{ formatDate(studentConsultation.teacherFeedback.createdAt) }}</span>
                    <span v-if="studentConsultation.teacherFeedback.score !== undefined" class="feedback-score">
                      <i class="fas fa-star"></i>
                      {{ studentConsultation.teacherFeedback.score }}/100
                    </span>
                  </div>
                  <p class="feedback-content">{{ studentConsultation.teacherFeedback.content }}</p>
                </div>
              </div>
              
              <div class="feedback-form">
                <!-- Score Input Field -->
                <div class="score-input-group">
                  <label for="consultationScore">Consultation Score:</label>
                  <div class="score-input-wrapper">
                    <input 
                      id="consultationScore"
                      v-model.number="consultationScore"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      placeholder="Enter score (1-100)"
                      class="score-input"
                      @input="validateScore"
                    />
                    <span class="score-suffix">/100</span>
                  </div>
                  <small class="score-help-text">Enter a score between 1 and 100 only</small>
                </div>

                <!-- Feedback Text Area -->
                <div class="feedback-text-group">
                  <label for="feedbackText">{{ studentConsultation.teacherFeedback ? 'Update Feedback:' : 'Provide Feedback:' }}</label>
                  <textarea 
                    id="feedbackText"
                    v-model="feedbackText"
                    placeholder="Enter your feedback for this consultation..."
                    rows="4"
                    class="feedback-textarea"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeConsultationModal">
            <i class="fas fa-times"></i>
            Close
          </button>
          <button 
            v-if="studentConsultation"
            class="feedback-btn" 
            @click="sendFeedback"
            :disabled="!feedbackText.trim() || isSendingFeedback"
          >
            <i class="fas fa-paper-plane"></i>
            {{ isSendingFeedback ? 'Sending...' : (studentConsultation.teacherFeedback ? 'Update Feedback' : 'Send Feedback') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mark as Done Loading Modal -->
    <div v-if="showMarkAsDoneModal" class="modal-overlay">
      <div class="loading-modal" @click.stop>
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h3>Marking Activity as Done</h3>
          <p>Please wait while we finalize the activity...</p>
          <div class="loading-steps">
            <div class="step" :class="{ active: markingStep >= 1 }">
              <i class="fas fa-check-circle"></i>
              <span>Ending live session</span>
            </div>
            <div class="step" :class="{ active: markingStep >= 2 }">
              <i class="fas fa-save"></i>
              <span>Storing student results</span>
            </div>
            <div class="step" :class="{ active: markingStep >= 3 }">
              <i class="fas fa-arrow-right"></i>
              <span>Redirecting to dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import liveSessionService from '../../services/liveSessionService'
import LiveLeaderboardModal from './LiveLeaderboardModal.vue'
import { roomAPI } from '../../services/api'
import api from '../../services/api'

export default {
  name: 'RoomInterface',
  components: {
    LiveLeaderboardModal
  },
  props: {
    roomData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      roomCode: this.$route.params.roomCode || '',
      maxStudents: 30,
      activityStarted: false,
      activityDuration: 0,
      toasts: [],
      joinedStudents: [],
      leaderboard: [],
      isLoading: true,
      error: null,
      realRoomData: {},
      studentsPollingInterval: null,
      showLeaderboard: false,
      showLeaderboardModal: false, // Add modal visibility state
      // Live session data
      liveSessionData: null,
      liveSessionListener: null,
      leaderboardListener: null,
      countdownRemaining: 0,
      countdownInterval: null,
      isStartingActivity: false,
      isCompletingActivity: false, // Add this new state
      isEndingRoom: false, // Add loading state for End Room button
      isCopied: false, // Add state for copy feedback
      showConfirmationModal: false, // Add state for confirmation modal
      confirmationResolve: null, // Store the promise resolve function
      // Modal loading indicators
      showStartActivityModal: false,
      showCompleteActivityModal: false,
      showEndRoomModal: false,
      // Consultation modal data (AI Patient rooms only)
      showConsultationModal: false,
      selectedStudent: null,
      studentConsultation: null,
      isLoadingConsultation: false,
      consultationError: null,
      feedbackText: '',
      consultationScore: null,
      isSendingFeedback: false,
      // Track students with submitted consultations for badge display
      studentsWithConsultations: new Set(),
      // Mark as Done loading modal
      showMarkAsDoneModal: false,
      markingStep: 0
    }
  },
  computed: {
    // Filter out completed students from the Students Joined section
    activeStudents() {
      if (!this.hasActivityStarted) {
        // Before activity starts, show all joined students
        return this.joinedStudents
      }
      
      // During/after activity, filter out completed students
      const completedStudentIds = new Set()
      
      // Get completed student IDs from leaderboard
      if (this.leaderboard && this.leaderboard.length > 0) {
        this.leaderboard.forEach(student => {
          if (student.status === 'completed' || student.progress >= 100) {
            completedStudentIds.add(student.studentId || student.id)
          }
        })
      }
      
      // Filter out completed students
      return this.joinedStudents.filter(student => 
        !completedStudentIds.has(student.studentId || student.id)
      )
    },

    canStart() {
      return this.activeStudents.length > 0 && 
             this.activeStudents.some(s => s.status === 'ready') && 
             !this.isStartingActivity &&
             (!this.liveSessionData || this.liveSessionData.status === 'waiting')
    },
    
    // Check if activity has been started (countdown, active, or completed)
    hasActivityStarted() {
      return this.liveSessionData && 
             ['countdown', 'active', 'completed'].includes(this.liveSessionData.status)
    },
    averageWPM() {
      if (!this.activityStarted || this.leaderboard.length === 0) return 0
      const total = this.leaderboard.reduce((sum, student) => sum + student.wpm, 0)
      return Math.round(total / this.leaderboard.length)
    },
    displayRoomData() {
      // Use real room data if available, otherwise fallback to props
      return Object.keys(this.realRoomData).length > 0 ? this.realRoomData : this.roomData
    },
    
    // Check if this is an AI Patient room (hide leaderboard for these rooms)
    isAIPatientRoom() {
      const roomData = this.displayRoomData
      return roomData.roomType === 'AI Patient' || 
             roomData.mode === 'AI Patient' ||
             roomData.module === 'AI Patient Simulation'
    },
    isCountdownActive() {
      return this.liveSessionData && 
             this.liveSessionData.status === 'countdown' && 
             this.countdownRemaining > 0
    },
    isActivityActive() {
      console.log('🔍 DEBUG isActivityActive:')
      console.log('  - liveSessionData:', this.liveSessionData)
      console.log('  - status:', this.liveSessionData?.status)
      console.log('  - result:', this.liveSessionData && this.liveSessionData.status === 'active')
      
      return this.liveSessionData && 
             this.liveSessionData.status === 'active'
    },
    
    // New computed property to check if all students are completed
    allStudentsCompleted() {
      console.log('🔍 Debugging allStudentsCompleted:')
      console.log('  - leaderboard:', this.leaderboard)
      console.log('  - leaderboard length:', this.leaderboard?.length)
      
      if (!this.leaderboard || this.leaderboard.length === 0) {
        console.log('  - Result: false (no leaderboard data)')
        return false
      }
      
      // Log each student's status
      this.leaderboard.forEach((student, index) => {
        console.log(`  - Student ${index + 1}: ${student.studentName} - Status: "${student.status}" - Progress: ${student.progress}%`)
      })
      
      // Check if all students are completed - either by status "completed" OR by 100% progress
      const allCompleted = this.leaderboard.every(student => {
        const isCompleted = student.status === 'completed' || student.progress >= 100
        console.log(`    - ${student.studentName}: status="${student.status}", progress=${student.progress}%, isCompleted=${isCompleted}`)
        return isCompleted
      })
      
      console.log('  - All students completed:', allCompleted)
      console.log('  - isActivityActive:', this.isActivityActive)
      
      return allCompleted
    }
  },
  async mounted() {
    await this.loadRoomData()
    this.setupLiveSessionListener()
    this.startStudentsPolling()
    
    // Check for existing consultations for badge display
    await this.checkAllStudentConsultations()
  },
  beforeUnmount() {
    this.cleanup()
  },
  watch: {
    '$route.params.roomCode': {
      immediate: true,
      handler(newRoomCode) {
        if (newRoomCode && newRoomCode !== this.roomCode) {
          this.roomCode = newRoomCode;
          this.loadRoomData();
        }
      }
    }
  },
  methods: {
    async loadRoomData() {
      if (!this.roomCode) {
        this.error = 'No room code provided'
        this.isLoading = false
        return
      }

      try {
        this.isLoading = true
        const response = await this.$roomAPI.getRoomByCode(this.roomCode)
        this.realRoomData = response.data
        this.activityStarted = response.data.status === 'active'
        
        if (this.activityStarted) {
          this.startDurationTimer()
        }
        
        await this.loadStudents()
      } catch (error) {
        console.error('Error loading room data:', error)
        this.error = 'Failed to load room data'
        this.showToast('Failed to load room data', 'error')
      } finally {
        this.isLoading = false
      }
    },

    async loadStudents() {
      try {
        const response = await this.$studentAPI.getStudentsInRoom(this.roomCode)
        this.joinedStudents = response.data.map(student => ({
          ...student,
          joinedAt: new Date(student.joinedAt)
        }))
        
        // Check for consultations after loading students (for AI Patient rooms)
        if (this.isAIPatientRoom) {
          await this.checkAllStudentConsultations()
        }
      } catch (error) {
        console.error('Error loading students:', error)
        this.showToast('Failed to load students', 'error')
      }
    },

    startStudentsPolling() {
      // Poll for student updates every 3 seconds
      this.studentsPollingInterval = setInterval(async () => {
        await this.loadStudents()
      }, 3000)
    },

    generateRoomCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    
    copyRoomCode() {
      navigator.clipboard.writeText(this.roomCode)
      this.showToast('Room code copied to clipboard!', 'success')
      
      // Show "Copied!" feedback
      this.isCopied = true
      setTimeout(() => {
        this.isCopied = false
      }, 2000) // Reset after 2 seconds
    },
    
    mapDifficultyLevel(difficultyLevel) {
      // Map the display difficulty levels to backend expected values
      const difficultyMap = {
        'Beginner': 'easy',
        'Intermediate': 'medium', 
        'Advanced': 'hard',
        'Easy': 'easy',
        'Normal': 'medium',
        'Hard': 'hard'
      };
      return difficultyMap[difficultyLevel] || 'medium';
    },

    convertModuleLabelToValue(moduleLabel) {
      // Convert module label to URL-friendly value (same logic as moduleService.createModuleValue)
      if (!moduleLabel) return 'nursing-ethics';
      
      return moduleLabel
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
    },

    async startActivity() {
      if (this.isStartingActivity) return
      
      this.isStartingActivity = true
      this.showStartActivityModal = true
      
      try {
        console.log('🚀 Starting live activity...')
        
        // Prepare activity data with proper module content and time limit
        const activityData = {
          countdownDuration: 10, // 10 second countdown
          moduleContent: this.convertModuleLabelToValue(this.displayRoomData.module) || 'nursing-ethics', // Convert label to value
          timeLimit: this.displayRoomData.mode === 'Timed' ? (this.displayRoomData.duration * 60) : 0, // Convert minutes to seconds, 0 for word count mode
          wordCount: this.displayRoomData.mode === 'Word Count Challenge' ? this.displayRoomData.wordCount : 0, // Set word count for word count mode
          settings: {
            showLeaderboard: true,
            allowLateJoin: false,
            autoEndAfterCompletion: true,
            gameMode: this.displayRoomData.mode === 'Timed' ? 'timed' : 'word-count',
            difficulty: this.mapDifficultyLevel(this.displayRoomData.difficultyLevel) || 'medium'
          }
        }
        
        console.log('Activity data:', activityData)
        
        // Start the live activity using Firebase
        const result = await liveSessionService.startActivity(this.roomCode, activityData)
        
        if (result.success) {
          console.log('✅ Live activity started successfully')
          this.showToast('Activity started! Live Leaderboard is now available.', 'success')
          
          // Show the modal instead of redirecting
          this.showLeaderboardModal = true
        } else {
          throw new Error(result.message || 'Failed to start activity')
        }
        
      } catch (error) {
        console.error('❌ Error starting activity:', error)
        this.showToast(error.message || 'Failed to start activity', 'error')
      } finally {
        this.isStartingActivity = false
        this.showStartActivityModal = false
      }
    },

    async updateRoomStatus(status) {
      try {
        await roomAPI.updateRoomStatus(this.roomCode, status)
      } catch (error) {
        console.error('Error updating room status:', error)
        this.showToast('Failed to update room status', 'error')
      }
    },
    
    async endRoom() {
      try {
        this.isEndingRoom = true
        this.showEndRoomModal = true
        console.log('🛑 Ending room:', this.roomCode)
        
        // End the live session first
        if (this.liveSessionData && this.liveSessionData.status !== 'completed') {
          await liveSessionService.endActivity(this.roomCode)
        }
        
        // Update room status
        await this.updateRoomStatus('completed')
        
        this.showToast('Room ended successfully', 'success')
        
        // Redirect to teacher dashboard after a short delay
        setTimeout(() => {
          this.showEndRoomModal = false
          this.isEndingRoom = false
          this.$router.push('/teacher-dashboard')
        }, 1500)
        
      } catch (error) {
        console.error('❌ Error ending room:', error)
        this.showToast('Failed to end room', 'error')
        
        // Hide modal and reset state for error cases
        this.isEndingRoom = false
        this.showEndRoomModal = false
      } finally {
        // Don't hide modal here for success case - it's handled in setTimeout
        // Only hide for error cases (handled in catch block)
      }
    },

    // New method to complete activity and save data
    async completeActivity() {
      // Show confirmation dialog
      const confirmed = await this.showConfirmationDialog(
        'Complete Activity',
        'Are you sure you want to complete this activity? This will end the session for all students and save their progress.',
        'Complete Activity',
        'Cancel'
      )
      
      if (!confirmed) {
        return // User cancelled
      }
      
      try {
        this.isCompletingActivity = true
        this.showCompleteActivityModal = true
        console.log('✅ Completing activity for room:', this.roomCode)
        
        // End the live session and save data
        const result = await liveSessionService.endActivity(this.roomCode)
        
        if (result.success) {
          // Update room status to completed
          await this.updateRoomStatus('completed')
          
          this.showToast('Activity completed successfully! Data has been saved.', 'success')
          
          // Redirect to teacher dashboard after a short delay to show success message
          setTimeout(() => {
            this.showCompleteActivityModal = false
            this.isCompletingActivity = false
            this.$router.push('/teacher-dashboard')
          }, 2000)
        } else {
          throw new Error(result.message || 'Failed to complete activity')
        }
        
      } catch (error) {
        console.error('❌ Error completing activity:', error)
        
        // Enhanced error handling with specific error messages
        let errorMessage = 'Failed to complete activity'
        
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to complete this activity.'
        } else if (error.message.includes('not found')) {
          errorMessage = 'Activity session not found. It may have already been completed.'
        } else if (error.message) {
          errorMessage = `Failed to complete activity: ${error.message}`
        }
        
        this.showToast(errorMessage, 'error')
        
        // Show additional error dialog for critical errors
        this.showErrorDialog(
          'Error Completing Activity',
          `${errorMessage}\n\nPlease try again or contact support if the problem persists.`
        )
        
        // Hide modal and reset state for error cases
        this.isCompletingActivity = false
        this.showCompleteActivityModal = false
        
      } finally {
          // Don't hide modal here for success case - it's handled in setTimeout
          // Only hide for error cases (when no setTimeout was triggered)
        }
    },

    // Simple Mark as Done method for AI Patient rooms
    async markAsDone() {
      try {
        this.isCompletingActivity = true
        this.showMarkAsDoneModal = true
        this.markingStep = 0
        
        // Step 1: End the live session to notify students
        this.markingStep = 1
        if (this.liveSessionData && this.liveSessionData.status !== 'completed') {
          await liveSessionService.endActivity(this.roomCode)
        }
        
        // Small delay to show step completion
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Step 2: Store AI Patient results for each student who has consultation + feedback
        this.markingStep = 2
        await this.storeAIPatientResults()
        
        // Small delay to show step completion
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Step 3: Redirect to teacher dashboard
        this.markingStep = 3
        
        // Small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Hide modal and redirect
        this.showMarkAsDoneModal = false
        this.$router.push('/teacher-dashboard')
        
      } catch (error) {
        console.error('❌ Error marking as done:', error)
        this.showMarkAsDoneModal = false
        this.showToast('Failed to mark as done', 'error')
      } finally {
        // Reset loading state
        this.isCompletingActivity = false
        this.markingStep = 0
      }
    },

    // Store AI Patient results in typingResults database for typing history
    async storeAIPatientResults() {
      if (!this.isAIPatientRoom) return
      
      try {
        console.log('📊 Storing AI Patient results for typing history...')
        
        // Get all students who have consultations with feedback
        for (const student of this.activeStudents) {
          try {
            // Check if student has consultation
            const consultationResponse = await api.get(`/consultations/student/${student.studentId}`)
            
            if (consultationResponse.data.success && consultationResponse.data.consultation) {
              const consultation = consultationResponse.data.consultation
              
              // Only store if there's teacher feedback with score
              if (consultation.teacherFeedback && consultation.teacherFeedback.score !== undefined) {
                const aiPatientResult = {
                  userId: student.studentId,
                  sessionType: 'ai-patient',
                  roomId: this.roomCode,
                  
                  // AI Patient specific data (using score as main metric)
                  wpm: 0, // Not applicable for AI Patient
                  accuracy: consultation.teacherFeedback.score || 0, // Use score as accuracy
                  duration: 1, // Set to 1 to meet validation requirements (not tracked for AI Patient)
                  wordsTyped: 0, // Not applicable
                  errorsCount: 0, // Not applicable
                  
                  // Required keystroke data (set to minimal values)
                  keystrokeData: {
                    totalKeystrokes: 0,
                    correctKeystrokes: 0,
                    backspaces: 0,
                    averageSpeed: 0
                  },
                  
                  // Content information
                  content: {
                    topic: 'AI Patient Consultation',
                    difficulty: this.roomData?.difficultyLevel || 'Medium',
                    textLength: 1 // Set to 1 to meet validation requirements
                  },
                  
                  // AI Patient specific additional data
                  aiPatientData: {
                    score: consultation.teacherFeedback.score,
                    feedback: consultation.teacherFeedback.content,
                    teacherName: consultation.teacherFeedback.teacherName,
                    studentName: student.studentName, // Add student name for leaderboard display
                    consultationId: consultation.id,
                    patientName: consultation.patientName || 'Virtual Patient'
                  }
                }
                
                // Save to typingResults collection
                const response = await api.post('/typing-results/save', aiPatientResult)
                
                if (response.data.success) {
                  console.log(`✅ AI Patient result saved for student: ${student.studentName}`)
                } else {
                  console.error(`❌ Failed to save AI Patient result for student: ${student.studentName}`)
                }
              }
            }
          } catch (error) {
            // 404 is expected when no consultation exists
            if (error.response?.status !== 404) {
              console.error(`Error processing AI Patient result for student ${student.studentId}:`, error)
            }
          }
        }
        
        console.log('✅ AI Patient results storage completed')
        
      } catch (error) {
        console.error('❌ Error storing AI Patient results:', error)
        // Don't throw error to avoid breaking the mark as done flow
      }
    },

    refreshLeaderboard() {
      // Get live leaderboard data from Firebase
      if (this.liveSessionData && this.liveSessionData.status === 'active') {
        liveSessionService.getLeaderboard(this.roomCode)
          .then(leaderboardData => {
            this.leaderboard = leaderboardData || [];
            this.showToast('Leaderboard updated', 'info');
          })
          .catch(error => {
            console.error('Error refreshing leaderboard:', error);
            this.showToast('Failed to refresh leaderboard', 'error');
          });
      } else {
        // Fallback to loading students if no live session
        this.loadStudents();
        this.showToast('Students list refreshed', 'info');
      }
    },
    
    formatJoinTime(date) {
      const now = new Date()
      const diff = Math.floor((now - date) / 1000)
      
      if (diff < 60) return `${diff}s ago`
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      return `${Math.floor(diff / 3600)}h ago`
    },
    
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },
    
    startDurationTimer() {
      setInterval(() => {
        this.activityDuration++
      }, 1000)
    },
    
    showToast(message, type = 'info') {
      const toast = {
        id: Date.now(),
        message,
        type
      }
      
      this.toasts.push(toast)
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        const index = this.toasts.findIndex(t => t.id === toast.id)
        if (index > -1) {
          this.toasts.splice(index, 1)
        }
      }, 3000)
    },

    toggleLeaderboard() {
      console.log('🔄 Toggle leaderboard clicked, current state:', this.showLeaderboardModal)
      this.showLeaderboardModal = !this.showLeaderboardModal
      console.log('🔄 New leaderboard state:', this.showLeaderboardModal)
      console.log('🔄 Room code:', this.roomCode)
      
      if (this.showLeaderboardModal) {
        this.showToast('Live Leaderboard opened', 'info')
      } else {
        this.showToast('Live Leaderboard closed', 'info')
      }
    },

    async kickStudent(student) {
      if (confirm(`Are you sure you want to kick ${student.studentName} from the room?`)) {
        try {
          await this.$studentAPI.leaveRoom(student.studentId, this.roomCode)
          this.showToast(`${student.studentName} has been removed from the room`, 'success')
          await this.loadStudents() // Refresh the students list
        } catch (error) {
          console.error('Error kicking student:', error)
          this.showToast('Failed to remove student', 'error')
        }
      }
    },

    closeLeaderboard() {
      this.showLeaderboard = false
    },

    // Live Session Methods
    setupLiveSessionListener() {
      if (!this.roomCode) return
      
      console.log('👂 Setting up live session listener for:', this.roomCode)
      
      this.liveSessionListener = liveSessionService.subscribeToLiveSession(
        this.roomCode,
        this.handleLiveSessionUpdate
      )
    },

    handleLiveSessionUpdate(update) {
      console.log('📊 Live session update received:', update)
      
      if (update.exists && update.data) {
        this.liveSessionData = update.data
        console.log('Current session status:', update.data.status)
        
        // Handle different session states
        switch (update.data.status) {
          case 'countdown':
            console.log('🔄 Switching to countdown state')
            this.handleCountdownState()
            break
          case 'active':
            console.log('🔄 Switching to active state - should redirect now')
            this.handleActiveState()
            break
          case 'completed':
            console.log('🔄 Switching to completed state')
            this.handleCompletedState()
            break
          default:
            console.log('🔄 Unknown session status:', update.data.status)
        }
        
        // Update leaderboard if available with real-time data
        if (update.data.leaderboard) {
          this.leaderboard = update.data.leaderboard
          console.log('📈 Leaderboard updated with', this.leaderboard.length, 'students')
        }
        
        // Subscribe to real-time leaderboard updates if activity is active
        if (update.data.status === 'active' && !this.leaderboardListener) {
          this.setupLeaderboardListener()
        }
        
      } else if (update.error) {
        console.error('❌ Live session listener error:', update.error)
        this.showToast('Connection error. Please refresh the page.', 'error')
      }
    },

    handleCountdownState() {
      console.log('⏰ Handling countdown state')
      
      if (!this.countdownInterval) {
        this.startCountdownTimer()
      }
      
      // Show leaderboard modal during countdown
      if (!this.showLeaderboard) {
        this.showLeaderboard = true
        this.showToast('Countdown started! Students are getting ready...', 'info')
      }
    },

    handleActiveState() {
      console.log('🏃 Handling active state')
      console.log('Current route:', this.$route.path)
      console.log('Room code:', this.roomCode)
      
      // Stop countdown timer
      this.stopCountdownTimer()
      
      // Set activity as started
      this.activityStarted = true
      
      // Show the modal instead of redirecting
      this.showToast('Activity is now active! Live Leaderboard is available.', 'success')
      this.showLeaderboardModal = true
    },

    handleCompletedState() {
      console.log('🏁 Handling completed state')
      
      // Stop all timers
      this.stopCountdownTimer()
      this.stopDurationTimer()
      
      this.showToast('Activity completed!', 'success')
    },

    startCountdownTimer() {
      if (!this.liveSessionData) return
      
      console.log('⏰ Starting countdown timer')
      
      this.countdownInterval = setInterval(() => {
        const remaining = liveSessionService.getCountdownRemaining(
          this.liveSessionData.countdownStartedAt,
          this.liveSessionData.countdownDuration
        )
        
        this.countdownRemaining = remaining
        
        if (remaining <= 0) {
          this.stopCountdownTimer()
        }
      }, 1000)
      
      // Initial calculation
      this.countdownRemaining = liveSessionService.getCountdownRemaining(
        this.liveSessionData.countdownStartedAt,
        this.liveSessionData.countdownDuration
      )
    },

    stopCountdownTimer() {
      if (this.countdownInterval) {
        console.log('⏰ Stopping countdown timer')
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
        this.countdownRemaining = 0
      }
    },

    stopDurationTimer() {
      if (this.durationInterval) {
        console.log('⏱️ Stopping duration timer')
        clearInterval(this.durationInterval)
        this.durationInterval = null
      }
    },

    setupLeaderboardListener() {
      console.log('📊 Setting up real-time leaderboard listener')
      
      // Subscribe to leaderboard updates
      this.leaderboardListener = liveSessionService.subscribeToLeaderboard(
        this.roomCode,
        (leaderboardData) => {
          console.log('📈 Real-time leaderboard update:', leaderboardData)
          
          // Direct assignment is reactive in Vue 3
          this.leaderboard = leaderboardData || []
          
          // Force immediate re-evaluation of computed properties
          this.$nextTick(() => {
            // Trigger reactivity by accessing the computed property
            const completed = this.allStudentsCompleted
            console.log('🔄 Forced reactivity check - allStudentsCompleted:', completed)
          })
        }
      )
    },

    stopLeaderboardListener() {
      if (this.leaderboardListener) {
        console.log('📊 Stopping leaderboard listener')
        this.leaderboardListener()
        this.leaderboardListener = null
      }
    },

    async endActivity() {
      try {
        console.log('🏁 Ending live activity...')
        
        const result = await liveSessionService.endActivity(this.roomCode)
        
        if (result.success) {
          this.showToast('Activity ended successfully!', 'success')
        } else {
          throw new Error(result.message || 'Failed to end activity')
        }
        
      } catch (error) {
        console.error('❌ Error ending activity:', error)
        this.showToast(error.message || 'Failed to end activity', 'error')
      }
    },

    // Dialog helper methods
    showConfirmationDialog() {
      return new Promise((resolve) => {
        this.showConfirmationModal = true
        this.confirmationResolve = resolve
      })
    },

    closeConfirmationModal() {
      this.showConfirmationModal = false
      if (this.confirmationResolve) {
        this.confirmationResolve(false)
        this.confirmationResolve = null
      }
    },

    confirmCompleteActivity() {
      this.showConfirmationModal = false
      if (this.confirmationResolve) {
        this.confirmationResolve(true)
        this.confirmationResolve = null
      }
    },

    showErrorDialog(title, message) {
      alert(`${title}\n\n${message}`)
    },

    cleanup() {
      console.log('🧹 Cleaning up RoomInterface...')
      
      // Stop polling
      if (this.studentsPollingInterval) {
        clearInterval(this.studentsPollingInterval)
        this.studentsPollingInterval = null
      }
      
      // Stop timers
      this.stopCountdownTimer()
      this.stopDurationTimer()
      
      // Clean up live session listener
      if (this.liveSessionListener) {
        this.liveSessionListener()
        this.liveSessionListener = null
      }
      
      // Clean up leaderboard listener
      this.stopLeaderboardListener()
      
      // Clean up all live session service listeners
      liveSessionService.cleanup()
    },

    // Consultation Modal Methods (AI Patient rooms only)
    async openConsultationModal(student) {
      if (!this.isAIPatientRoom) return
      
      this.selectedStudent = student
      this.showConsultationModal = true
      this.consultationError = null
      this.feedbackText = ''
      
      await this.loadStudentConsultation(student.studentId)
    },

    closeConsultationModal() {
      this.showConsultationModal = false
      this.selectedStudent = null
      this.studentConsultation = null
      this.consultationError = null
      this.feedbackText = ''
      this.isLoadingConsultation = false
      this.isSendingFeedback = false
    },

    async loadStudentConsultation(studentId) {
      this.isLoadingConsultation = true
      this.consultationError = null
      
      try {
        // Make API call to get student's consultation data
        const response = await api.get(`/consultations/student/${studentId}`)
        
        if (response.data.success) {
          this.studentConsultation = response.data.consultation
          
          // Pre-fill feedback text if there's existing feedback
          if (this.studentConsultation?.teacherFeedback?.content) {
            this.feedbackText = this.studentConsultation.teacherFeedback.content
          }
        } else {
          // No consultation found - this is normal
          this.studentConsultation = null
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          // No consultation found - this is normal, don't log as error
          this.studentConsultation = null
        } else {
          console.error('Error loading student consultation:', error)
          this.consultationError = 'Failed to load consultation data. Please try again.'
        }
      } finally {
        this.isLoadingConsultation = false
      }
    },

    async sendFeedback() {
      if (!this.feedbackText.trim() || !this.selectedStudent || !this.studentConsultation) return
      
      this.isSendingFeedback = true
      
      try {
        // Get teacher info from localStorage or user store
        const teacherName = localStorage.getItem('teacherName') || 'Teacher'
        
        const feedbackData = {
          studentId: this.selectedStudent.studentId,
          consultationId: this.studentConsultation.id,
          feedback: {
            content: this.feedbackText.trim(),
            teacherName: teacherName,
            createdAt: new Date().toISOString()
          }
        }
        
        // Add score if provided
        if (this.consultationScore !== null && this.consultationScore !== '') {
          feedbackData.feedback.score = parseInt(this.consultationScore)
        }
        
        const response = await api.post('/consultations/feedback', feedbackData)
        
        if (response.data.success) {
          // Update the consultation data with the new feedback
          this.studentConsultation.teacherFeedback = feedbackData.feedback
          
          // Clear the form
          this.feedbackText = ''
          this.consultationScore = null
          
          this.showToast('Feedback sent successfully!', 'success')
          
          // Optionally close the modal after sending feedback
          // this.closeConsultationModal()
        } else {
          throw new Error(response.data.message || 'Failed to send feedback')
        }
        
      } catch (error) {
        console.error('Error sending feedback:', error)
        this.showToast('Failed to send feedback. Please try again.', 'error')
      } finally {
        this.isSendingFeedback = false
      }
    },

    validateScore(event) {
      const value = event.target.value
      
      // Allow empty value (user can clear the field)
      if (value === '' || value === null) {
        this.consultationScore = null
        event.target.classList.remove('invalid')
        return
      }
      
      const numericValue = parseInt(value)
      
      // Check if it's a valid number
      if (isNaN(numericValue)) {
        event.target.value = ''
        this.consultationScore = null
        event.target.classList.add('invalid')
        this.showToast('Please enter a valid number for the score', 'error')
        return
      }
      
      // Enforce range 1-100
      if (numericValue < 1 || numericValue > 100) {
        // If less than 1, set to 1
        if (numericValue < 1) {
          event.target.value = 1
          this.consultationScore = 1
        }
        // If greater than 100, set to 100
        else if (numericValue > 100) {
          event.target.value = 100
          this.consultationScore = 100
        }
        
        event.target.classList.add('invalid')
        this.showToast('Score must be between 1 and 100', 'error')
        
        // Remove invalid class after a short delay
        setTimeout(() => {
          event.target.classList.remove('invalid')
        }, 2000)
        
        return
      }
      
      // Valid score
      this.consultationScore = numericValue
      event.target.classList.remove('invalid')
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown date'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } catch (error) {
        return 'Invalid date'
      }
    },

    formatMessageTime(timestamp) {
      if (!timestamp) return ''
      
      try {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } catch (error) {
        return ''
      }
    },

    formatAllergies(allergies) {
      if (!allergies) return 'Not specified'
      
      // Handle string format (legacy)
      if (typeof allergies === 'string') {
        return allergies || 'Not specified'
      }
      
      // Handle object format (new checkbox system)
      if (typeof allergies === 'object') {
        if (allergies.hasNoKnownAllergies) {
          return 'No known allergies'
        }
        
        if (allergies.hasAllergies && allergies.types) {
          const selectedTypes = []
          
          // Check each allergy type
          if (allergies.types.food) selectedTypes.push('Food')
          if (allergies.types.medicine) selectedTypes.push('Medicine')
          if (allergies.types.latex) selectedTypes.push('Latex')
          if (allergies.types.environment) selectedTypes.push('Environment')
          
          // Add others if specified
          if (allergies.others && allergies.others.trim()) {
            selectedTypes.push(`Others: ${allergies.others.trim()}`)
          }
          
          if (selectedTypes.length > 0) {
            return selectedTypes.join(', ')
          }
        }
        
        return 'Has allergies (not specified)'
      }
      
      return 'Not specified'
    },

    // Check if student has submitted consultation (for notification badge)
    hasConsultationSubmitted(student) {
      return this.studentsWithConsultations.has(student.studentId)
    },

    // Check for consultations for all students (called when room loads)
    async checkAllStudentConsultations() {
      if (!this.isAIPatientRoom) return
      
      for (const student of this.activeStudents) {
        try {
          const response = await api.get(`/consultations/student/${student.studentId}`)
          if (response.data.success && response.data.consultation) {
            this.studentsWithConsultations.add(student.studentId)
          }
        } catch (error) {
          // 404 is expected when no consultation exists, don't log as error
          if (error.response?.status !== 404) {
            console.error(`Error checking consultation for student ${student.studentId}:`, error)
          }
        }
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.room-interface {
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'DM Sans', sans-serif;
  color: var(--text-primary);
  padding: 20px;
}

.room-header {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-primary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.room-meta {
  display: flex;
  gap: 12px;
}

.section-badge, .mode-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.section-badge {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
}

.mode-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.room-actions {
  display: flex;
  gap: 12px;
}

.copy-code-btn, .start-btn, .end-btn, .leaderboard-btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.copy-code-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.copy-code-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.leaderboard-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.leaderboard-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.leaderboard-btn.active {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  border-color: var(--accent-primary);
}

.leaderboard-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

.start-btn {
  background: var(--success-gradient);
  color: var(--text-on-accent);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--success-color-alpha);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.end-btn {
  background: var(--error-gradient);
  color: var(--text-on-accent);
}

.end-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--error-color-alpha);
}

.complete-btn {
  background: var(--success-gradient);
  color: var(--text-on-accent);
}

.complete-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--success-color-alpha);
}

.complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-code-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  align-items: center;
}

.room-code-container {
  text-align: center;
}

.code-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.room-code {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent-color);
  letter-spacing: 8px;
  margin-bottom: 8px;
  text-shadow: 0 0 20px var(--accent-color-alpha);
}

.code-instruction {
  color: var(--text-secondary);
  font-size: 14px;
}

.qr-code-container {
  text-align: center;
}

.qr-placeholder {
  width: 120px;
  height: 120px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.qr-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  display: grid;
  gap: 24px;
  margin-bottom: 24px;
}

.students-section, .leaderboard-section {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.student-counter {
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.student-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

.student-card.empty-slot {
  background: #474a51;
  border: 2px dashed var(--border-primary);
  justify-content: center;
  text-align: center;
  flex-direction: column;
  gap: 8px;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-on-accent);
  font-weight: 600;
  font-size: 16px;
}

.student-avatar.small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.empty-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.student-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.student-status.ready {
  color: var(--success-color);
}

.student-status.waiting {
  color: var(--warning-color);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.join-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.refresh-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  transform: rotate(180deg);
}

.leaderboard-content {
  min-height: 300px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leaderboard-item {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  animation: slideInRight 0.5s ease-out;
  animation-fill-mode: both;
}

.leaderboard-item.top-three {
  background: var(--accent-gradient-alpha);
  border-color: var(--accent-color);
}

.rank {
  width: 32px;
  text-align: center;
}

.medal {
  font-size: 20px;
}

.rank-number {
  font-weight: 700;
  color: var(--text-secondary);
}

.student-details {
  flex: 1;
}

.student-details .name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.progress {
  font-size: 12px;
  color: var(--text-secondary);
}

.stats {
  text-align: right;
}

.wpm {
  font-weight: 600;
  color: var(--success-color);
  margin-bottom: 4px;
}

.accuracy {
  font-size: 12px;
  color: var(--text-secondary);
}

.leaderboard-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
}

.placeholder-icon {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.placeholder-text {
  color: var(--text-secondary);
  font-size: 16px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

.stat-icon {
  background: var(--accent-gradient);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 500;
  animation: slideInRight 0.3s ease-out;
  min-width: 250px;
}

.toast.success {
  border-color: var(--success-color);
  background: var(--success-color-alpha);
}

.toast.info {
  border-color: var(--accent-color);
  background: var(--accent-color-alpha);
}

.toast-icon {
  color: currentColor;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Leaderboard Modal Styles */
.leaderboard-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--modal-overlay);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.leaderboard-modal-content {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 0;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid var(--border-color);
  animation: slideInUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--accent-gradient);
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-white);
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn {
  background: var(--bg-overlay-light);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-overlay-medium);
  transform: scale(1.1);
}

.leaderboard-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Confirmation Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.confirmation-modal {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: 0 20px 40px var(--shadow-dark);
  max-width: 480px;
  width: 90%;
  animation: slideInUp 0.3s ease;
  border: 1px solid var(--border-color);
}

.modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.modal-header .close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-header .close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.warning-icon {
  margin-bottom: 16px;
}

.warning-icon i {
  font-size: 48px;
  color: var(--warning-color);
}

.modal-body p {
  color: var(--text-primary);
  font-size: 16px;
  margin: 8px 0;
  line-height: 1.5;
}

.warning-text {
  color: var(--text-secondary) !important;
  font-size: 14px !important;
}

.modal-footer {
  padding: 0 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.cancel-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.confirm-btn {
  background: var(--error-color);
  color: var(--text-white);
}

.confirm-btn:hover:not(:disabled) {
  background: var(--error-color-dark);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  background: var(--text-secondary);
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .room-code-section {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .room-interface {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .room-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .room-code {
    font-size: 32px;
    letter-spacing: 4px;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Loading Modal Styles */
.loading-modal {
  background: var(--bg-secondary);
  border-radius: 20px;
  box-shadow: 0 25px 50px var(--shadow-dark);
  max-width: 400px;
  width: 90%;
  animation: slideInUp 0.3s ease;
  border: 1px solid var(--border-primary);
}

/* Consultation Modal Styles (AI Patient rooms only) */
.consultation-modal {
  background: var(--bg-secondary);
  border-radius: 20px;
  box-shadow: 0 25px 50px var(--shadow-dark);
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideInUp 0.3s ease;
  border: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
}

.consultation-modal .modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
  border-radius: 20px 20px 0 0;
}

.consultation-modal .modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.consultation-modal .modal-header h3 i {
  color: var(--accent-primary);
  font-size: 22px;
}

.consultation-modal .close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.consultation-modal .close-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.consultation-modal .modal-body {
  padding: 24px 32px;
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 200px);
}

.consultation-modal .modal-footer {
  padding: 20px 32px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: var(--bg-tertiary);
  border-radius: 0 0 20px 20px;
}

/* Loading, Error, and No Consultation States */
.loading-state, .error-state, .no-consultation-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-state i, .error-state i, .no-consultation-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-state i {
  color: var(--accent-primary);
}

.error-state i {
  color: var(--error-color);
}

.no-consultation-state i {
  color: var(--text-tertiary);
}

.no-consultation-state h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.no-consultation-state p {
  margin: 0;
  font-size: 14px;
}

/* Consultation Content Styles */
.consultation-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.consultation-section {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-primary);
}

.consultation-section.feedback-section {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title i {
  color: var(--accent-primary);
  font-size: 18px;
}

/* Patient Information Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
}

/* Findings Content */
.findings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.finding-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.finding-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.finding-item p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  line-height: 1.5;
  min-height: 20px;
}

/* Conversation Section */
.conversation-section {
  background: var(--bg-secondary);
  border-color: var(--accent-secondary);
}

.conversation-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
}

.conversation-messages {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-message {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}

.conversation-message.student-message {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  margin-left: 20px;
}

.conversation-message.ai-message {
  background: var(--bg-secondary);
  border-color: var(--border-secondary);
  margin-right: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-sender {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-sender i {
  font-size: 14px;
}

.student-message .message-sender {
  color: var(--accent-primary);
}

.ai-message .message-sender {
  color: var(--text-secondary);
}

.message-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.message-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Feedback Section */
.existing-feedback {
  margin-bottom: 16px;
}

.feedback-item {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-primary);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feedback-author {
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 14px;
}

.feedback-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.feedback-content {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-form label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feedback-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-color-alpha);
}

.feedback-textarea::placeholder {
  color: var(--text-tertiary);
}

/* Modal Footer Buttons */
.cancel-btn, .feedback-btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.cancel-btn {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.cancel-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.feedback-btn {
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  min-width: 140px;
  justify-content: center;
}

.feedback-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-color-alpha);
}

.feedback-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Student Card Enhancements for AI Patient Rooms */
.student-card.clickable-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.student-card.clickable-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px var(--shadow-medium);
  border-color: var(--accent-primary);
}

.student-card.clickable-card.has-consultation {
  border-left: 4px solid var(--success-color);
}

.student-card.clickable-card.has-consultation::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: var(--success-color);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
  z-index: 2;
}

.consultation-status {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.consultation-status.submitted {
  background: var(--success-color-alpha);
  color: var(--success-color);
}

.consultation-status.pending {
  background: var(--warning-color-alpha);
  color: var(--warning-color);
}

/* Responsive Design for Consultation Modal */
@media (max-width: 768px) {
  .consultation-modal {
    max-width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .consultation-modal .modal-header,
  .consultation-modal .modal-body,
  .consultation-modal .modal-footer {
    padding: 16px 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .consultation-modal .modal-footer {
    flex-direction: column;
  }
  
  .cancel-btn, .feedback-btn {
    width: 100%;
    justify-content: center;
  }
}

.loading-content {
  padding: 3rem 2rem;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1.5rem;
  background: var(--accent-gradient);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--text-on-accent);
  animation: spin 1s linear infinite;
}

.loading-content h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.loading-content p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode specific gradient for room interface buttons */
[data-theme="dark"] .copy-code-btn,
[data-theme="dark"] .leaderboard-btn {
  background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%);
  color: white;
  border: none;
}

[data-theme="dark"] .start-btn,
[data-theme="dark"] .complete-btn {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(21, 128, 61) 100%);
  color: white;
  border: none;
}

[data-theme="dark"] .end-btn {
  background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(185, 28, 28) 100%);
  color: white;
  border: none;
}

[data-theme="dark"] .copy-code-btn:hover,
[data-theme="dark"] .leaderboard-btn:hover {
  background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

[data-theme="dark"] .start-btn:hover:not(:disabled),
[data-theme="dark"] .complete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(21, 128, 61) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
}

[data-theme="dark"] .end-btn:hover {
  background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(185, 28, 28) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

/* Light mode specific styling for empty-slot and buttons */
[data-theme="light"] .student-card.empty-slot {
  background: #e7e9eb;
}

[data-theme="light"] .copy-code-btn,
[data-theme="light"] .leaderboard-btn {
  background: linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(30, 64, 175) 100%);
  color: white;
  border: none;
}

[data-theme="light"] .start-btn,
[data-theme="light"] .complete-btn {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(21, 128, 61) 100%);
  color: white;
  border: none;
}

[data-theme="light"] .end-btn {
  background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(185, 28, 28) 100%);
  color: white;
  border: none;
}

[data-theme="light"] .copy-code-btn:hover,
[data-theme="light"] .leaderboard-btn:hover {
  background: linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(30, 64, 175) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

[data-theme="light"] .start-btn:hover:not(:disabled),
[data-theme="light"] .complete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(21, 128, 61) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
}

[data-theme="light"] .end-btn:hover {
  background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(185, 28, 28) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

/* Hide QR code */
.qr-code-container {
  display: none;
}

/* Score input styling */
.score-input-group {
  margin-bottom: 15px;
}

.score-input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.score-input-wrapper {
  position: relative;
  display: inline-block;
  width: 120px;
}

.score-input {
  width: 100%;
  padding: 8px 25px 8px 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.score-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.score-suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 14px;
  pointer-events: none;
}

.score-input.invalid {
  border-color: #ef4444;
}

.score-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Score display in feedback */
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

/* Dark theme adjustments */
[data-theme="dark"] .score-input-group label {
  color: #d1d5db;
}

[data-theme="dark"] .score-input {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

[data-theme="dark"] .score-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

[data-theme="dark"] .score-suffix {
  color: #9ca3af;
}

/* Mark as Done Loading Modal */
.loading-modal {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.loading-content h3 {
  margin: 20px 0 10px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.loading-content p {
  color: #6b7280;
  margin-bottom: 30px;
  font-size: 16px;
}

.loading-spinner {
  margin-bottom: 20px;
}

.loading-spinner i {
  font-size: 48px;
  color: #3b82f6;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: left;
}

.loading-steps .step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  opacity: 0.5;
}

.loading-steps .step.active {
  background: #eff6ff;
  border-color: #3b82f6;
  opacity: 1;
}

.loading-steps .step i {
  color: #9ca3af;
  font-size: 16px;
  width: 20px;
  text-align: center;
  transition: color 0.3s ease;
}

.loading-steps .step.active i {
  color: #3b82f6;
}

.loading-steps .step span {
  color: #6b7280;
  font-weight: 500;
  transition: color 0.3s ease;
}

.loading-steps .step.active span {
  color: #1f2937;
}

/* Dark theme for loading modal */
[data-theme="dark"] .loading-modal {
  background: #1f2937;
}

[data-theme="dark"] .loading-content h3 {
  color: #f9fafb;
}

[data-theme="dark"] .loading-content p {
  color: #d1d5db;
}

[data-theme="dark"] .loading-steps .step {
  background: #374151;
  border-color: #4b5563;
}

[data-theme="dark"] .loading-steps .step.active {
  background: #1e3a8a;
  border-color: #60a5fa;
}

[data-theme="dark"] .loading-steps .step i {
  color: #6b7280;
}

[data-theme="dark"] .loading-steps .step.active i {
  color: #60a5fa;
}

[data-theme="dark"] .loading-steps .step span {
  color: #9ca3af;
}

[data-theme="dark"] .loading-steps .step.active span {
  color: #f9fafb;
}
</style>