/**
 * Конфигурационный файл проекта
 * ООО "Волга-Днепр Инжиниринг"
 */

const CONFIG = {
  PERFORMANCE: {
    SCROLL_DEBOUNCE_MS: 10,
    ANIMATION_THRESHOLD: 100
  },
  NAVIGATION: {
    SCROLL_HEADER_THRESHOLD: 100,
    SCROLL_TOP_THRESHOLD: 500
  },
  FORM: {
    RATE_LIMIT_MS: 60000,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    ALLOWED_MIME_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  ANIMATION: {
    COUNTER_STEPS: 100,
    FADE_IN_THRESHOLD: 100,
    MODAL_CLOSE_DELAY_MS: 3000,
    OBSERVER_THRESHOLD: 0.1,
    ROOT_MARGIN: '50px'
  },
  CONTACT: {
    MAP_URL: 'https://yandex.ru/maps/-/CDu~eKqJ',
    EMAIL: 'info@volga-dnepr-engineering.ru',
    PHONE: '+7 (495) 000-00-00'
  },
  DEBUG: false
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}