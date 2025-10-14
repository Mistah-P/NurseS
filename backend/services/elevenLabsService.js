const axios = require('axios');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseURL = 'https://api.elevenlabs.io/v1';
    // Default voice ID - you can change this to any voice you prefer
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice
  }

  /**
   * Convert text to speech using Eleven Labs
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Voice options
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async textToSpeech(text, options = {}) {
    try {
      const {
        voiceId = this.defaultVoiceId,
        stability = 0.5,
        similarityBoost = 0.75,
        style = 0.0,
        useSpeakerBoost = true
      } = options;

      const response = await axios.post(
        `${this.baseURL}/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
            style: style,
            use_speaker_boost: useSpeakerBoost
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      let errorMessage = 'Failed to convert text to speech';
      
      if (error.response?.data) {
        // If the response data is a buffer, try to decode it
        if (Buffer.isBuffer(error.response.data)) {
          try {
            const decodedError = JSON.parse(error.response.data.toString());
            console.error('Eleven Labs API Error (decoded):', decodedError);
            errorMessage = decodedError.detail?.message || decodedError.detail?.status || errorMessage;
          } catch (parseError) {
            console.error('Eleven Labs API Error (raw buffer):', error.response.data);
          }
        } else {
          console.error('Eleven Labs API Error:', error.response.data);
          errorMessage = error.response.data.detail?.message || error.response.data.detail?.status || errorMessage;
        }
      } else {
        console.error('Eleven Labs API Error:', error.message);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get available voices from Eleven Labs
   * @returns {Promise<Array>} - Array of available voices
   */
  async getAvailableVoices() {
    try {
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url
      }));
    } catch (error) {
      console.error('Error fetching voices:', error.response?.data || error.message);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Get voice settings for a specific voice
   * @param {string} voiceId - Voice ID
   * @returns {Promise<Object>} - Voice settings
   */
  async getVoiceSettings(voiceId = this.defaultVoiceId) {
    try {
      const response = await axios.get(`${this.baseURL}/voices/${voiceId}/settings`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching voice settings:', error.response?.data || error.message);
      throw new Error('Failed to fetch voice settings');
    }
  }

  /**
   * Convert text to speech with patient-appropriate voice settings
   * @param {string} text - Text to convert
   * @param {Object} patientContext - Patient context for voice customization
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async generatePatientSpeech(text, patientContext = {}) {
    const { patientData } = patientContext;
    
    // Customize voice settings based on patient context
    const voiceOptions = this.getVoiceOptionsForPatient(patientData);
    
    return await this.textToSpeech(text, voiceOptions);
  }

  /**
   * Get appropriate voice options based on patient data
   * @param {Object} patientData - Patient information
   * @returns {Object} - Voice options
   */
  getVoiceOptionsForPatient(patientData = {}) {
    const { gender, age } = patientData;
    
    // Default voice settings
    let voiceOptions = {
      stability: 0.6,
      similarityBoost: 0.8,
      style: 0.2,
      useSpeakerBoost: true
    };

    // Adjust voice based on gender (if you have different voice IDs)
    if (gender === 'Female') {
      // You can set a female voice ID here
      voiceOptions.voiceId = process.env.ELEVENLABS_FEMALE_VOICE_ID || this.defaultVoiceId;
    } else if (gender === 'Male') {
      // You can set a male voice ID here
      voiceOptions.voiceId = process.env.ELEVENLABS_MALE_VOICE_ID || this.defaultVoiceId;
    }

    // Adjust voice characteristics based on age
    if (age) {
      if (age < 30) {
        voiceOptions.style = 0.3; // More energetic
        voiceOptions.stability = 0.5;
      } else if (age > 60) {
        voiceOptions.style = 0.1; // More calm
        voiceOptions.stability = 0.7;
      }
    }

    return voiceOptions;
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

  /**
   * Get usage information from Eleven Labs
   * @returns {Promise<Object>} - Usage information
   */
  async getUsageInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return {
        characterCount: response.data.subscription.character_count,
        characterLimit: response.data.subscription.character_limit,
        canExtendCharacterLimit: response.data.subscription.can_extend_character_limit
      };
    } catch (error) {
      console.error('Error fetching usage info:', error.response?.data || error.message);
      throw new Error('Failed to fetch usage information');
    }
  }
}

module.exports = new ElevenLabsService();