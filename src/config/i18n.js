const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

let initialized = false;

// Initialize i18next
i18next
  .use(Backend)
  .init({
    lng: 'uz',
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru', 'en'],
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}.json')
    },
    interpolation: {
      escapeValue: false
    },
    initImmediate: false
  })
  .then(() => {
    initialized = true;
  })
  .catch((err) => {
    console.error('Error initializing i18next:', err);
  });

module.exports = i18next;

