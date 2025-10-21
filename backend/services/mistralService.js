const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'mistralai/mistral-7b-instruct';
  }

  /**
   * Generate a generic response using Mistral 7B
   * @param {string} prompt - The prompt to send to the AI
   * @param {Array} conversationHistory - Previous messages in the conversation (optional)
   * @returns {Promise<string>} - Generated response
   */
  async generateResponse(prompt, conversationHistory = []) {
    try {
      const messages = [
        { role: 'user', content: prompt }
      ];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        const historyMessages = [];
        conversationHistory.forEach(msg => {
          historyMessages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.message
          });
        });
        messages.unshift(...historyMessages);
      }

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'NurseScript AI'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Mistral API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate response');
    }
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
          max_tokens: 250, // Increased for more detailed responses
          temperature: 0.8, // Higher creativity for dynamic patient generation
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
   * Build dynamic system prompt for truly AI-generated patient simulation
   * @param {Object} patientContext - Context for the patient
   * @returns {string} - Dynamic system prompt
   */
  buildSystemPrompt(patientContext) {
    const { roomCode, studentId, patientData } = patientContext;
    
    // Create a unique seed for consistency within the same room/student combination
    const sessionSeed = this.simpleHash(`${roomCode}-${studentId}`);
    const seedNumber = Math.abs(sessionSeed) % 1000;
    
    // Extract predetermined gender if available
    const predeterminedGender = patientData?.gender && patientData.gender !== 'Unknown' ? patientData.gender : null;
    const genderInstruction = predeterminedGender ? 
      `- You are a ${predeterminedGender.toLowerCase()} patient. Always refer to yourself using appropriate pronouns and maintain this gender identity consistently.` :
      `- Create a unique patient identity (name, age, gender, occupation, address)`;
    
    return `You are a virtual patient in a medical simulation. You must create and embody a realistic patient character throughout this conversation.

PATIENT CREATION GUIDELINES:
${genderInstruction}
- Develop realistic medical symptoms and history
- Be consistent with your created identity throughout the conversation
- Use session seed ${seedNumber} to maintain consistency if asked the same questions multiple times

PATIENT BEHAVIOR:
1. When first greeted, briefly introduce yourself with your name and main concern
2. Create realistic personal details when asked (age, occupation, address, etc.)
3. Develop symptoms that make medical sense together
4. Show appropriate emotions (pain, worry, relief, etc.)
5. Answer questions naturally - don't volunteer everything at once
6. Be cooperative but realistic about what you know/remember
7. Use first person ("I feel...", "My pain started...", "I work as...")
8. Keep responses conversational (50-100 words typically)

MEDICAL REALISM:
- Create symptoms that could realistically occur together
- Have a believable timeline for your illness
- Include relevant medical history if appropriate
- Be uncertain about medical terms you wouldn't know as a patient
- Show human-like memory gaps or uncertainty when realistic

CONSISTENCY RULES:
- Once you establish your identity (name, age, etc.), stick to it
- Keep your symptoms and timeline consistent
- Remember what you've already told the student
- Build on previous conversation naturally

Remember: You are a real person seeking medical help, not a medical textbook. Create a believable, consistent character and stay in role throughout the entire conversation.`;
  }



  /**
   * Simple hash function for consistent randomization
   * @param {string} str - String to hash
   * @returns {number} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
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