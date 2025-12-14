// Voice Assistant Service
// Uses OpenAI Whisper API for speech-to-text transcription
// Supports OGG to MP3 conversion via ffmpeg for better quality

const openaiService = require('./ai/openaiService');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class VoiceService {
  constructor() {
    this._ffmpegAvailable = null; // Cache for ffmpeg availability check
  }

  /**
   * Check if FFmpeg is available (module and binary)
   * @returns {Promise<boolean>} - True if both fluent-ffmpeg and ffmpeg binary are available
   */
  async isFFmpegAvailable() {
    // Return cached result if available
    if (this._ffmpegAvailable !== null) {
      return this._ffmpegAvailable;
    }

    try {
      // Check if fluent-ffmpeg module is installed
      require.resolve('fluent-ffmpeg');
      const ffmpeg = require('fluent-ffmpeg');
      
      // Check if ffmpeg binary is available
      return new Promise((resolve) => {
        // Set timeout to avoid hanging
        const timeout = setTimeout(() => {
          this._ffmpegAvailable = false;
          resolve(false);
        }, 5000); // 5 second timeout

        try {
          ffmpeg.getAvailableCodecs((err, codecs) => {
            clearTimeout(timeout);
            const available = !err && codecs && Object.keys(codecs).length > 0;
            this._ffmpegAvailable = available;
            resolve(available);
          });
        } catch (checkError) {
          clearTimeout(timeout);
          this._ffmpegAvailable = false;
          resolve(false);
        }
      });
    } catch (error) {
      // fluent-ffmpeg not installed or ffmpeg binary not found
      this._ffmpegAvailable = false;
      return false;
    }
  }

  /**
   * Convert OGG audio to MP3 using ffmpeg (optional, for better quality)
   * @param {Buffer} oggBuffer - OGG audio buffer
   * @param {string} outputFormat - Output format (mp3, wav, etc.)
   * @returns {Promise<Buffer>} - Converted audio buffer
   */
  async convertAudioFormat(oggBuffer, outputFormat = 'mp3') {
    // Check if FFmpeg is available before attempting conversion
    const ffmpegAvailable = await this.isFFmpegAvailable();
    
    if (!ffmpegAvailable) {
      // FFmpeg not available, return original buffer silently
      return oggBuffer;
    }

    try {
      const ffmpeg = require('fluent-ffmpeg');
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `input_${Date.now()}.ogg`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.${outputFormat}`);

      // Write OGG buffer to temp file
      await fs.writeFile(inputPath, oggBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat(outputFormat)
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .on('end', async () => {
            try {
              const convertedBuffer = await fs.readFile(outputPath);
              // Clean up temp files
              await fs.remove(inputPath).catch(() => {});
              await fs.remove(outputPath).catch(() => {});
              resolve(convertedBuffer);
            } catch (error) {
              // On error reading converted file, return original
              await fs.remove(inputPath).catch(() => {});
              await fs.remove(outputPath).catch(() => {});
              resolve(oggBuffer);
            }
          })
          .on('error', async (error) => {
            // Clean up temp files on error
            try {
              await fs.remove(inputPath).catch(() => {});
              await fs.remove(outputPath).catch(() => {});
            } catch {}
            // Return original buffer instead of rejecting
            resolve(oggBuffer);
          })
          .save(outputPath);
      });
    } catch (error) {
      // If any error occurs, return original buffer
      return oggBuffer;
    }
  }

  /**
   * Transcribe voice file using OpenAI Whisper
   * @param {Buffer|Stream} voiceFile - Voice file buffer or stream
   * @param {string} language - Language code (uz, ru, en) - NOT USED, Whisper auto-detects
   * @param {Object} options - Additional options (convertToMp3: boolean)
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeVoice(voiceFile, language = 'uz', options = {}) {
    try {
      let audioBuffer = voiceFile;

      // Convert OGG to MP3 if ffmpeg is available and option is enabled
      // Note: Whisper API supports OGG directly, but MP3 might give better results
      if (options.convertToMp3 !== false) {
        // convertAudioFormat will check FFmpeg availability internally
        // and return original buffer if FFmpeg is not available
        audioBuffer = await this.convertAudioFormat(voiceFile, 'mp3');
      }

      // Use OpenAI Whisper for transcription
      // Whisper auto-detects language, so language parameter is not used
      const transcribedText = await openaiService.transcribeAudio(audioBuffer, language);
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
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  async processVoiceMessage(voiceFile, language, options = {}) {
    try {
      const text = await this.transcribeVoice(voiceFile, language, options);
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
   * Download voice file from Telegram
   * @param {string} fileUrl - URL of the voice file
   * @returns {Promise<Buffer>} - File buffer
   */
  async downloadVoiceFile(fileUrl) {
    try {
      // Use native fetch instead of axios
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      const response = await fetch(fileUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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

  /**
   * Check if ffmpeg is available (alias for isFFmpegAvailable)
   * @returns {Promise<boolean>} - True if ffmpeg is available
   */
  async checkFFmpegAvailable() {
    return await this.isFFmpegAvailable();
  }
}

module.exports = new VoiceService();
