/**
 * Text Transformer Utility
 * Transforms text content based on difficulty levels for typing practice
 */

class TextTransformer {
  /**
   * Transform text based on difficulty level
   * @param {string} text - Original text content
   * @param {string} difficulty - Difficulty level ('easy', 'normal', 'hard' or 'Beginner', 'Intermediate', 'Advanced')
   * @returns {string} Transformed text
   */
  static transformText(text, difficulty) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Normalize difficulty level to lowercase
    const normalizedDifficulty = this.normalizeDifficulty(difficulty);
    
    switch (normalizedDifficulty) {
      case 'easy':
        return this.transformToEasy(text);
      case 'normal':
        return this.transformToNormal(text);
      case 'hard':
        return this.transformToHard(text);
      default:
        // If no valid difficulty specified, return original text
        return text;
    }
  }

  /**
   * Normalize difficulty level to standard format
   * @param {string} difficulty - Input difficulty level
   * @returns {string} Normalized difficulty ('easy', 'normal', 'hard')
   */
  static normalizeDifficulty(difficulty) {
    if (!difficulty || typeof difficulty !== 'string') {
      return 'normal'; // Default to normal if not specified
    }

    const lower = difficulty.toLowerCase();
    
    // Map various difficulty formats to standard format
    if (lower === 'easy' || lower === 'beginner') {
      return 'easy';
    } else if (lower === 'normal' || lower === 'intermediate') {
      return 'normal';
    } else if (lower === 'hard' || lower === 'advanced') {
      return 'hard';
    }
    
    return 'normal'; // Default fallback
  }

  /**
   * Transform text to EASY difficulty:
   * - All lowercase
   * - Remove special characters (keep only letters, numbers, spaces, and basic punctuation)
   * @param {string} text - Original text
   * @returns {string} Easy difficulty text
   */
  static transformToEasy(text) {
    return text
      .toLowerCase() // Convert all to lowercase
      .replace(/[^\w\s]/g, '') // Remove ALL punctuation and special characters, keep only letters, numbers, and spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  }

  /**
   * Transform text to normal difficulty (capital letters, no punctuation or special characters)
   * @param {string} text - Input text
   * @returns {string} Normal difficulty text
   */
  static transformToNormal(text) {
    // Remove ALL punctuation and special characters, keep only letters, numbers, and spaces
    let cleanText = text
      .replace(/[^\w\s]/g, '') // Remove ALL punctuation and special characters, keep only letters, numbers, and spaces
      .replace(/\s+/g, ' ')
      .trim();

    // Keep the natural capitalization from the original text
    // This preserves proper nouns, sentence beginnings, etc.
    return cleanText;
  }

  /**
   * Transform text to HARD difficulty:
   * - Keep original text exactly as is
   * - Preserve natural capital letters and special characters
   * @param {string} text - Original text
   * @returns {string} Hard difficulty text (original text unchanged)
   */
  static transformToHard(text) {
    // For hard difficulty, return the original text exactly as it is
    // This preserves the natural capital letters and special characters
    return text.trim();
  }

  /**
   * Get difficulty description for UI display
   * @param {string} difficulty - Difficulty level
   * @returns {string} Human-readable description
   */
  static getDifficultyDescription(difficulty) {
    const normalizedDifficulty = this.normalizeDifficulty(difficulty);
    
    switch (normalizedDifficulty) {
      case 'easy':
        return 'All lowercase, plain text only (no punctuation)';
      case 'normal':
        return 'Mixed case, plain text only (no punctuation)';
      case 'hard':
        return 'Original text with all punctuation and formatting';
      default:
        return 'Standard text formatting';
    }
  }
}

export default TextTransformer;