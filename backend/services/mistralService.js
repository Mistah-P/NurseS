const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'mistralai/mistral-7b-instruct';
  }

  /**
   * Generate patient response using Mistral 7B
   * @param {string} userMessage - The nurse's message/question
   * @param {Object} patientContext - Patient information and medical context
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @returns {Promise<string>} - Generated patient response
   */
  async generatePatientResponse(userMessage, patientContext, conversationHistory = []) {
    try {
      const systemPrompt = this.buildSystemPrompt(patientContext);
      const messages = this.buildMessageHistory(systemPrompt, conversationHistory, userMessage);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'NurseScript AI Patient'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Mistral API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate patient response');
    }
  }

  /**
   * Build system prompt based on patient context
   * @param {Object} patientContext - Patient information
   * @returns {string} - System prompt
   */
  buildSystemPrompt(patientContext) {
    const { patientData, findings } = patientContext;
    
    return `You are a virtual patient in a medical simulation. You must respond as a real patient would, staying in character throughout the conversation.

PATIENT PROFILE:
- Name: ${patientData?.name || 'Patient'}
- Age: ${this.calculateAge(patientData?.dateOfBirth) || 'Unknown'}
- Gender: ${patientData?.gender || 'Unknown'}
- Occupation: ${patientData?.occupation || 'Unknown'}

MEDICAL CONTEXT:
- Chief Complaint: ${findings?.chiefComplaint || 'General consultation'}
- Present Illness: ${findings?.presentIllness || 'None specified'}
- Past Illnesses: ${findings?.pastIllnesses || 'None specified'}
- Allergies: ${findings?.allergies || 'None known'}
- Current Medications: ${findings?.medications || 'None'}

INSTRUCTIONS:
1. Respond as this patient would, using first person ("I feel...", "My pain is...")
2. Be realistic about symptoms and feelings
3. Show appropriate emotions (concern, pain, relief, etc.)
4. Ask relevant questions a real patient might ask
5. Keep responses conversational and natural (50-100 words)
6. Stay consistent with the medical context provided
7. If asked about symptoms not in your profile, respond appropriately ("I don't have that symptom" or "I'm not sure")
8. Show human-like uncertainty when appropriate

Remember: You are a patient seeking medical care, not a medical professional.`;
  }

  /**
   * Build message history for the conversation
   * @param {string} systemPrompt - System prompt
   * @param {Array} conversationHistory - Previous messages
   * @param {string} currentMessage - Current user message
   * @returns {Array} - Formatted message array
   */
  buildMessageHistory(systemPrompt, conversationHistory, currentMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'nurse' ? 'user' : 'assistant',
        content: msg.message
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Calculate age from date of birth
   * @param {string} dateOfBirth - Date of birth string
   * @returns {number|null} - Age in years
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate API configuration
   * @returns {boolean} - True if properly configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new MistralService();