/**
 * Google Services Integration
 * Handles Google Translate, Maps, and other Google APIs
 */

require('dotenv').config();

class GoogleService {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.baseURL = 'https://translation.googleapis.com/language/translate/v2';
    this.mapsBaseURL = 'https://maps.googleapis.com/maps/api';
    
    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_API_KEY is not set in environment variables');
    }
  }

  /**
   * Translate text using Google Translate API
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code (uz, ru, en)
   * @param {string} sourceLang - Source language code (auto-detected if not provided)
   * @returns {Promise<string>} - Translated text
   */
  async translate(text, targetLang = 'uz', sourceLang = 'auto') {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const languageMap = {
      uz: 'uz',
      ru: 'ru',
      en: 'en'
    };

    const target = languageMap[targetLang] || 'uz';
    const source = sourceLang === 'auto' ? '' : (languageMap[sourceLang] || '');

    try {
      const url = `${this.baseURL}?key=${this.apiKey}&q=${encodeURIComponent(text)}&target=${target}${source ? `&source=${source}` : ''}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Translate API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        return data.data.translations[0].translatedText;
      }

      return text; // Return original if translation fails
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language
   * @returns {Promise<Object>} - Language detection result
   */
  async detectLanguage(text) {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    try {
      const url = `${this.baseURL}/detect?key=${this.apiKey}&q=${encodeURIComponent(text)}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.detections && data.data.detections.length > 0) {
        const detection = data.data.detections[0][0];
        return {
          language: detection.language,
          confidence: detection.confidence
        };
      }

      return { language: 'unknown', confidence: 0 };
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }

  /**
   * Translate multiple texts at once
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code
   * @returns {Promise<Array<string>>} - Array of translated texts
   */
  async translateBatch(texts, targetLang = 'uz', sourceLang = 'auto') {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const languageMap = {
      uz: 'uz',
      ru: 'ru',
      en: 'en'
    };

    const target = languageMap[targetLang] || 'uz';
    const source = sourceLang === 'auto' ? '' : (languageMap[sourceLang] || '');

    try {
      const queryParams = texts.map(text => `q=${encodeURIComponent(text)}`).join('&');
      const url = `${this.baseURL}?key=${this.apiKey}&${queryParams}&target=${target}${source ? `&source=${source}` : ''}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Translate API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.translations) {
        return data.data.translations.map(t => t.translatedText);
      }

      return texts; // Return originals if translation fails
    } catch (error) {
      console.error('Error in batch translation:', error);
      throw error;
    }
  }

  /**
   * Get place details using Google Places API
   * @param {string} placeName - Name or address of the place
   * @param {string} language - Response language
   * @returns {Promise<Object>} - Place details
   */
  async findPlace(placeName, language = 'uz') {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const languageMap = {
      uz: 'uz',
      ru: 'ru',
      en: 'en'
    };

    const lang = languageMap[language] || 'uz';

    try {
      // First, search for the place
      const searchUrl = `${this.mapsBaseURL}/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${this.apiKey}&language=${lang}`;

      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`Google Places API error: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();

      if (searchData.results && searchData.results.length > 0) {
        const place = searchData.results[0];
        
        // Get detailed information
        const detailsUrl = `${this.mapsBaseURL}/place/details/json?place_id=${place.place_id}&key=${this.apiKey}&language=${lang}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        return {
          name: place.name,
          address: place.formatted_address,
          location: place.geometry?.location,
          rating: place.rating,
          details: detailsData.result
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding place:', error);
      throw error;
    }
  }

  /**
   * Get distance and directions between two locations
   * @param {Object} origin - Origin coordinates {lat, lng} or address
   * @param {Object} destination - Destination coordinates {lat, lng} or address
   * @param {string} language - Response language
   * @returns {Promise<Object>} - Distance and directions
   */
  async getDirections(origin, destination, language = 'uz') {
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const languageMap = {
      uz: 'uz',
      ru: 'ru',
      en: 'en'
    };

    const lang = languageMap[language] || 'uz';

    try {
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.lat},${origin.lng}`;
      
      const destStr = typeof destination === 'string'
        ? destination
        : `${destination.lat},${destination.lng}`;

      const url = `${this.mapsBaseURL}/directions/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&key=${this.apiKey}&language=${lang}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Directions API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          distanceValue: leg.distance.value,
          duration: leg.duration.text,
          durationValue: leg.duration.value,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions,
            distance: step.distance.text,
            duration: step.duration.text
          }))
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }
}

module.exports = new GoogleService();

