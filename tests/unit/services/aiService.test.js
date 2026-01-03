const aiService = require('../../../src/services/aiService');
const Anthropic = require('@anthropic-ai/sdk');

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('AIService', () => {
  
  let mockAnthropic;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Anthropic client
    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    };
    
    Anthropic.mockImplementation(() => mockAnthropic);
  });
  
  describe('analyzeApplication', () => {
    it('should analyze application text and return metrics', async () => {
      // Arrange
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            clarity: 8,
            length: 250,
            isCorrectOrg: true,
            successProbability: 85,
            suggestedOrg: null
          })
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      const applicationText = "Bizning ko'chamizda yorug'lik yo'q. Iltimos tuzating.";
      
      // Act
      const result = await aiService.analyzeApplication(applicationText);
      
      // Assert
      expect(result).toHaveProperty('clarity');
      expect(result).toHaveProperty('length');
      expect(result).toHaveProperty('isCorrectOrg');
      expect(result).toHaveProperty('successProbability');
      expect(result.clarity).toBeGreaterThanOrEqual(1);
      expect(result.clarity).toBeLessThanOrEqual(10);
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.successProbability).toBeLessThanOrEqual(100);
    });
    
    it('should handle empty text', async () => {
      // Arrange & Act & Assert
      await expect(aiService.analyzeApplication(''))
        .rejects
        .toThrow();
    });
    
    it('should handle API errors gracefully', async () => {
      // Arrange
      mockAnthropic.messages.create.mockRejectedValue(new Error('API Error'));
      
      // Act & Assert
      await expect(aiService.analyzeApplication('test'))
        .rejects
        .toThrow();
    });
  });
  
  describe('improveApplication', () => {
    it('should improve application text professionally', async () => {
      // Arrange
      const mockResponse = {
        content: [{
          text: "Hurmatli Toshkent shahar hokimi!\n\nMen Chilonzor tumani 12-mavze sakiniman..."
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      const originalText = "Ko'chamizda yorug'lik yo'q";
      const organization = "Toshkent shahar hokimligi";
      
      // Act
      const result = await aiService.improveApplication(originalText, organization);
      
      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(originalText.length);
    });
  });
  
  describe('chatAssistant', () => {
    it('should provide helpful responses', async () => {
      // Arrange
      const mockResponse = {
        content: [{
          text: "Sizga murojaat yozishda yordam beraman..."
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      const userMessage = "Qanday murojaat yozishim kerak?";
      
      // Act
      const result = await aiService.chatAssistant(userMessage);
      
      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('should maintain conversation history', async () => {
      // Arrange
      const history = [
        { role: 'user', content: 'Salom' },
        { role: 'assistant', content: 'Assalomu alaykum!' }
      ];
      
      const mockResponse = {
        content: [{
          text: "Ha, albatta yordam beraman"
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      // Act
      await aiService.chatAssistant('Yordam bera olasizmi?', history);
      
      // Assert
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            ...history,
            { role: 'user', content: 'Yordam bera olasizmi?' }
          ])
        })
      );
    });
  });
  
  describe('predictSuccess', () => {
    it('should predict application success probability', async () => {
      // Arrange
      const application = {
        text: "Professional murojaat matni...",
        organization: { name: "Test Org", rating: 4.5 },
        category: "mahalla"
      };
      
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            probability: 87,
            factors: {
              textQuality: 9,
              organizationMatch: 8,
              timing: 7
            },
            suggestions: []
          })
        }]
      };
      
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      // Act
      const result = await aiService.predictSuccess(application);
      
      // Assert
      expect(result).toHaveProperty('probability');
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(100);
    });
  });
});

