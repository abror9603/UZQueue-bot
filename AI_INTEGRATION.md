# AI Integration Guide - UZQueue Bot

This document describes the complete AI integration using OpenAI and Google APIs.

## 🚀 Overview

The UZQueue Bot now uses:
- **OpenAI GPT-4** for intelligent responses, document generation, and analysis
- **OpenAI Whisper** for voice transcription
- **OpenAI Vision (GPT-4o)** for document image analysis
- **Google Translate API** for translation services
- **Google Maps API** for location services

## 📋 Environment Variables

Add these to your `.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini

# Google API Configuration
GOOGLE_API_KEY=your_google_api_key_here
```

## 🏗️ Architecture

### Service Structure

```
src/services/ai/
├── openaiService.js      # OpenAI API wrapper (GPT, Whisper, Vision)
├── googleService.js      # Google APIs wrapper (Translate, Maps)
└── aiHelper.js           # Helper functions for easy AI interactions
```

### Main Services

- **SmartRoutingService** - Uses OpenAI GPT to analyze problems and recommend organizations
- **DocumentService** - Uses OpenAI GPT to generate professional documents
- **VoiceService** - Uses OpenAI Whisper for voice-to-text transcription
- **DocumentRecognitionService** - Uses OpenAI Vision for document image analysis

## 🔧 Usage Examples

### 1. Ask AI a Question

```javascript
const { askAI } = require('./services/ai/aiHelper');

// Ask in Uzbek
const response = await askAI('Pasport olish uchun qayerga borish kerak?', 'uz');

// Ask in Russian
const responseRu = await askAI('Где получить паспорт?', 'ru');

// Ask in English
const responseEn = await askAI('Where can I get a passport?', 'en');
```

### 2. Generate Document

```javascript
const documentService = require('./services/documentService');

const document = await documentService.prepareDocument(
  'Pasport olish uchun ariza kerak',
  'application',
  'uz'
);
```

### 3. Analyze Problem (Smart Routing)

```javascript
const smartRoutingService = require('./services/smartRoutingService');

const recommendation = await smartRoutingService.analyzeProblem(
  'Pasport olish kerak',
  'uz'
);

console.log(recommendation.organization);  // Bosh migratsiya xizmati
console.log(recommendation.requiredDocuments);  // [documents array]
```

### 4. Transcribe Voice

```javascript
const voiceService = require('./services/voiceService');

// audioBuffer is a Buffer from Telegram voice message
const text = await voiceService.transcribeVoice(audioBuffer, 'uz');
```

### 5. Analyze Document Image

```javascript
const documentRecognitionService = require('./services/documentRecognitionService');

// imageUrl is a URL to the image
const analysis = await documentRecognitionService.analyzeDocument(
  imageUrl,
  'passport',
  'uz'
);

console.log(analysis.generalFields);  // Extracted fields
console.log(analysis.errors);         // Errors found
```

### 6. Translate Text

```javascript
const { translate } = require('./services/ai/aiHelper');

const translated = await translate('Hello', 'uz');  // Translate to Uzbek
```

### 7. Find Place (Google Maps)

```javascript
const googleService = require('./services/ai/googleService');

const place = await googleService.findPlace('Toshkent, Ozbekiston', 'uz');
console.log(place.name, place.address);
```

## 🌍 Multilingual Support

All AI responses are generated in the selected language:

- **Uzbek (uz)** - Default language
- **Russian (ru)** - Русский язык
- **English (en)** - English

The system automatically:
1. Detects user's preferred language from their profile
2. Generates AI responses in that language
3. Translates if needed using Google Translate

## 🔐 Security

- ✅ All API keys stored in environment variables
- ✅ Never hardcoded in source code
- ✅ `.env` file is gitignored
- ✅ Secrets management ready for Docker/Cloud deployment

## 📦 Dependencies

Required packages (already added to `package.json`):

```json
{
  "form-data": "^4.0.0"
}
```

## 🎯 Features

### OpenAI Integration

1. **GPT-4 Chat** - Natural language understanding and generation
2. **Whisper** - Speech-to-text transcription
3. **Vision (GPT-4o)** - Image and document analysis

### Google Integration

1. **Translate API** - Text translation between languages
2. **Maps/Places API** - Location search and directions

## 🛠️ Configuration

### OpenAI Model Selection

Default model: `gpt-4o-mini` (cost-effective)

You can change it in `.env`:
```env
OPENAI_MODEL=gpt-4o  # More powerful, more expensive
```

### Google API Services

Make sure your Google API key has these APIs enabled:
- Translate API
- Places API
- Maps JavaScript API (if needed)

Enable in: [Google Cloud Console](https://console.cloud.google.com/apis/library)

## 🐛 Troubleshooting

### OpenAI API Errors

```javascript
// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not configured');
}
```

### Google API Errors

```javascript
// Check if API key is set
if (!process.env.GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY not configured');
}
```

### Common Issues

1. **"API key not configured"**
   - Check `.env` file exists
   - Verify environment variables are loaded
   - Restart application after changing `.env`

2. **"Rate limit exceeded"**
   - OpenAI: Check your usage limits
   - Google: Check quota in Cloud Console
   - Implement retry logic if needed

3. **"Model not found"**
   - Check `OPENAI_MODEL` is correct
   - Verify you have access to the model

## 📊 Cost Optimization

- Use `gpt-4o-mini` for most tasks (cheaper)
- Use `gpt-4o` only for complex vision tasks
- Cache responses when possible
- Implement request rate limiting

## 🚀 Future Enhancements

- [ ] Response caching with Redis
- [ ] Streaming responses for long documents
- [ ] Batch processing for multiple requests
- [ ] Cost tracking and monitoring
- [ ] Fallback to templates if API fails
- [ ] Custom fine-tuned models for UZQueue

## 📚 API Documentation

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Google Translate API](https://cloud.google.com/translate/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)

## ✅ Testing

Test each service:

```javascript
// Test OpenAI
const { askAI } = require('./services/ai/aiHelper');
const response = await askAI('Test question', 'uz');
console.log(response);

// Test Google Translate
const { translate } = require('./services/ai/aiHelper');
const translated = await translate('Test', 'ru');
console.log(translated);
```

---

**Note**: Always keep your API keys secure. Never commit them to version control!

