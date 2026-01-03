const TranslationService = require('../../../src/services/translationService');

describe('TranslationService', () => {
  
  describe('translate', () => {
    it('should translate a simple key', () => {
      const result = TranslationService.translate('back', 'uz');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('should translate with variables', () => {
      const result = TranslationService.translate('total_count', 'uz', { count: 5 });
      expect(result).toContain('5');
    });
    
    it('should fallback to default language if translation not found', () => {
      const result = TranslationService.translate('nonexistent_key', 'uz');
      expect(result).toBeTruthy();
    });
  });
  
  describe('formatNumber', () => {
    it('should format number for Uzbek locale', () => {
      const result = TranslationService.formatNumber(1234567, 'uz');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('should format number for Russian locale', () => {
      const result = TranslationService.formatNumber(1234567, 'ru');
      expect(result).toBeTruthy();
    });
    
    it('should format number for English locale', () => {
      const result = TranslationService.formatNumber(1234567, 'en');
      expect(result).toBeTruthy();
    });
  });
  
  describe('formatDate', () => {
    it('should format date for Uzbek locale', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = TranslationService.formatDate(date, 'uz', 'full');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('should format date with short format', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = TranslationService.formatDate(date, 'uz', 'short');
      expect(result).toBeTruthy();
    });
    
    it('should format date with time format', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = TranslationService.formatDate(date, 'uz', 'time');
      expect(result).toBeTruthy();
    });
  });
  
  describe('pluralize', () => {
    it('should handle Uzbek pluralization', () => {
      // This would require plural forms in translation files
      // For now, just test that it doesn't throw
      expect(() => {
        TranslationService.pluralize(1, 'day', 'uz');
      }).not.toThrow();
    });
  });
  
  describe('getAvailableLanguages', () => {
    it('should return array of available languages', () => {
      const languages = TranslationService.getAvailableLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });
  });
  
  describe('getLanguageName', () => {
    it('should return language name for uz', () => {
      const name = TranslationService.getLanguageName('uz');
      expect(name).toBe("O'zbek");
    });
    
    it('should return language name for ru', () => {
      const name = TranslationService.getLanguageName('ru');
      expect(name).toBe('Русский');
    });
    
    it('should return language name for en', () => {
      const name = TranslationService.getLanguageName('en');
      expect(name).toBe('English');
    });
  });
});

