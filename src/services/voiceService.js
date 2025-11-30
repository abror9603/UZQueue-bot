// Voice Assistant Service
// Uses OpenAI Whisper API for speech-to-text transcription

const openaiService = require('./ai/openaiService');
const FormData = require('form-data');

class VoiceService {
  /**
   * Transcribe voice file using OpenAI Whisper
   * @param {Buffer|Stream} voiceFile - Voice file buffer or stream
   * @param {string} language - Language code (uz, ru, en)
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeVoice(voiceFile, language = 'uz') {
    try {
      // Use OpenAI Whisper for transcription
      const transcribedText = await openaiService.transcribeAudio(voiceFile, language);
      return transcribedText;
    } catch (error) {
      console.error('Error transcribing voice with OpenAI Whisper:', error);
      
      // Fallback message based on language
      const fallbackMessages = {
        uz: 'Kechirasiz, ovozni taniy olmadik. Iltimos, qayta yuboring.',
        ru: 'Извините, не удалось распознать голос. Пожалуйста, отправьте снова.',
        en: 'Sorry, could not recognize voice. Please send again.'
      };

      throw new Error(fallbackMessages[language] || fallbackMessages.uz);
    }
  }

  /**
   * Process voice message from Telegram
   * @param {Buffer|Stream} voiceFile - Voice file
   * @param {string} language - Expected language
   * @returns {Promise<Object>} - Processing result
   */
  async processVoiceMessage(voiceFile, language) {
    try {
      const text = await this.transcribeVoice(voiceFile, language);
      return {
        success: true,
        text: text
      };
    } catch (error) {
      console.error('Error processing voice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert Telegram voice file to buffer
   * Helper method for downloading voice files
   * @param {string} fileUrl - URL of the voice file
   * @returns {Promise<Buffer>} - File buffer
   */
  async downloadVoiceFile(fileUrl) {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading voice file:', error);
      throw error;
    }
  }
}

module.exports = new VoiceService();
