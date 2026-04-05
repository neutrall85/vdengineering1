/**
 * Валидация данных
 * ООО "Волга-Днепр Инжиниринг"
 */

class Validator {
  static email(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  static phone(phone) {
    const clean = phone.replace(/[^0-9]/g, '');
    return clean.length >= 10 && clean.length <= 11;
  }

  static required(value) {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  }

  static minLength(value, min) {
    if (typeof value === 'string') {
      return value.trim().length >= min;
    }
    return false;
  }

  static maxLength(value, max) {
    if (typeof value === 'string') {
      return value.length <= max;
    }
    return true;
  }

  static file(file, config = CONFIG.FORM) {
    if (!file) return { valid: true };

    if (file.size > config.MAX_FILE_SIZE) {
      return { valid: false, error: `Максимальный размер файла: ${config.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (!config.ALLOWED_FILE_TYPES.includes(extension)) {
      return { valid: false, error: 'Недопустимый тип файла' };
    }

    if (file.type && !config.ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn('Необычный MIME-тип:', file.type);
    }

    return { valid: true };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}