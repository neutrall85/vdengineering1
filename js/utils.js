/**
 * Объединённые утилиты: DOM, Валидация, Форматирование, Лимитирование
 * ООО "Волга-Днепр Инжиниринг"
 */

const Utils = (function() {
  // ========== DOM утилиты ==========
  const DOM = {
    createElement(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else if (key === 'on' && typeof value === 'object') {
          Object.entries(value).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
          });
        } else {
          element.setAttribute(key, value);
        }
      });
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
      return element;
    },

    createSVG(path, width = 24, height = 24, className = '') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      if (className) svg.classList.add(className);
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', path);
      svg.appendChild(pathElement);
      return svg;
    },

    getElement(id) {
      const element = document.getElementById(id);
      if (!element && window.CONFIG?.DEBUG) {
        console.warn(`Element with id "${id}" not found`);
      }
      return element || null;
    },

    query(selector, context = document) {
      return context.querySelector(selector);
    },

    queryAll(selector, context = document) {
      return Array.from(context.querySelectorAll(selector));
    },

    trapFocus(element) {
      const focusable = this.queryAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        element
      );
      if (focusable.length === 0) return null;
      
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      const handler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      
      element.addEventListener('keydown', handler);
      return () => element.removeEventListener('keydown', handler);
    },

    toggleBodyScroll(disable) {
      if (disable) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    },

    setAttributes(element, attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          element.setAttribute(key, value);
        }
      });
    },

    addClass(element, ...classes) {
      if (!element) return;
      classes.forEach(cls => { if (cls) element.classList.add(cls); });
    },

    removeClass(element, ...classes) {
      if (!element) return;
      classes.forEach(cls => { if (cls) element.classList.remove(cls); });
    },

    hasClass(element, className) {
      return element.classList.contains(className);
    },

    toggleClass(element, className, force) {
      if (force !== undefined) {
        element.classList.toggle(className, force);
      } else {
        element.classList.toggle(className);
      }
    }
  };

  // ========== Санитизация HTML ==========
  const Sanitizer = {
    // Базовое экранирование HTML
    escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Разрешенные теги и атрибуты для безопасного рендеринга
    sanitizeHtml(html, options = {}) {
      if (!html) return '';
      
      const allowedTags = options.allowedTags || [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4',
        'ul', 'ol', 'li', 'a', 'span', 'div', 'img', 'table', 'tr', 'td', 'th'
      ];
      
      const allowedAttributes = options.allowedAttributes || {
        'a': ['href', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height'],
        '*': ['class', 'id']
      };
      
      // Создаем временный DOM элемент
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Рекурсивная очистка узлов
      const cleanNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          
          // Удаляем неразрешенные теги
          if (!allowedTags.includes(tagName)) {
            const parent = node.parentNode;
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
            return;
          }
          
          // Очищаем атрибуты
          const attributes = Array.from(node.attributes);
          attributes.forEach(attr => {
            const attrName = attr.name.toLowerCase();
            const allowedForTag = allowedAttributes[tagName] || allowedAttributes['*'] || [];
            
            if (!allowedForTag.includes(attrName)) {
              node.removeAttribute(attrName);
            } else if (attrName === 'href' || attrName === 'src') {
              // Проверка на опасные протоколы
              const value = attr.value.toLowerCase();
              if (value.startsWith('javascript:') || value.startsWith('data:') || value.startsWith('vbscript:')) {
                node.removeAttribute(attrName);
              }
            }
          });
          
          // Рекурсивно очищаем дочерние узлы
          Array.from(node.childNodes).forEach(child => cleanNode(child));
        }
      };
      
      Array.from(tempDiv.childNodes).forEach(child => cleanNode(child));
      return tempDiv.innerHTML;
    },

    // Проверка URL на безопасность
    isValidUrl(url) {
      if (!url) return false;
      try {
        const parsed = new URL(url, window.location.origin);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }
  };

  // ========== Валидатор ==========
  const Validator = {
    email(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    },

    phone(phone) {
      const clean = phone.replace(/[^0-9]/g, '');
      return clean.length >= 10 && clean.length <= 11;
    },

    required(value) {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    },

    minLength(value, min) {
      if (typeof value === 'string') {
        return value.trim().length >= min;
      }
      return false;
    },

    maxLength(value, max) {
      if (typeof value === 'string') {
        return value.length <= max;
      }
      return true;
    },

    file(file, config = window.CONFIG?.FORM) {
      if (!file) return { valid: true };
      
      if (file.size > config.MAX_FILE_SIZE) {
        return { 
          valid: false, 
          error: `Максимальный размер файла: ${config.MAX_FILE_SIZE / 1024 / 1024}MB` 
        };
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
  };

  // ========== Форматирование телефона ==========
  const PhoneFormatter = {
    format(input) {
      const clean = this._clean(input);
      if (!clean && input.value !== '') return '+7 (';
      if (!clean) return '';
      return this._applyMask(clean);
    },

    _clean(value) {
      let cleaned = value.replace(/[^0-9]/g, '');
      // Если начинается с 8 или 7, убираем первую цифру (будем добавлять +7 автоматически)
      if (cleaned.startsWith('8')) cleaned = cleaned.slice(1);
      if (cleaned.startsWith('7')) cleaned = cleaned.slice(1);
      return cleaned.slice(0, 10);
    },

    _applyMask(clean) {
      // Всегда начинаем с +7
      if (clean.length === 0) return '+7 (';
      if (clean.length <= 3) return `+7 (${clean}`;
      if (clean.length <= 6) return `+7 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
      if (clean.length <= 8) return `+7 (${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
      return `+7 (${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 10)}`;
    },

    bindToInput(inputElement) {
      // При фокусе, если поле пустое, сразу показываем +7 (
      inputElement.addEventListener('focus', () => {
        if (!inputElement.value || inputElement.value.trim() === '') {
          inputElement.value = '+7 (';
        }
      });

      // При потере фокуса, если введен только +7 (, очищаем поле
      inputElement.addEventListener('blur', () => {
        if (inputElement.value === '+7 (' || inputElement.value === '+7') {
          inputElement.value = '';
        }
      });

      const handler = (e) => {
        const cursorPos = e.target.selectionStart;
        const formatted = this.format(e.target.value);
        e.target.value = formatted;
        if (cursorPos) e.target.setSelectionRange(cursorPos, cursorPos);
      };
      inputElement.addEventListener('input', handler);
      return () => inputElement.removeEventListener('input', handler);
    }
  };

  // ========== Лимитирование запросов ==========
  class RateLimiter {
    constructor(storage, key = 'lastFormSubmit', limitMs = window.CONFIG?.FORM?.RATE_LIMIT_MS || 60000) {
      this.storage = storage;
      this.key = key;
      this.limitMs = limitMs;
    }

    canProceed() {
      const lastSubmit = this.storage.get(this.key);
      if (!lastSubmit) return true;
      return Date.now() - lastSubmit >= this.limitMs;
    }

    record() {
      this.storage.set(this.key, Date.now());
      return this;
    }

    reset() {
      this.storage.remove(this.key);
      return this;
    }

    getRemainingTime() {
      const lastSubmit = this.storage.get(this.key);
      if (!lastSubmit) return 0;
      const elapsed = Date.now() - lastSubmit;
      return Math.max(0, this.limitMs - elapsed);
    }
  }

  // ========== Утилиты для работы со строками и slug ==========
  const SlugUtils = {
    /**
     * Месяцы на русском для парсинга
     */
    _months: {
      'январь': '01', 'февраль': '02', 'март': '03', 'апрель': '04',
      'май': '05', 'июнь': '06', 'июль': '07', 'август': '08',
      'сентябрь': '09', 'октябрь': '10', 'ноябрь': '11', 'декабрь': '12'
    },

    /**
     * Генерирует URL-friendly slug из строки
     * @param {string} text - исходный текст
     * @returns {string} slug
     */
    generateSlug(text) {
      if (!text) return '';
      
      return text
        .toLowerCase()
        .replace(/[^а-яёa-z0-9\s-]/gi, '') // Удаляем спецсимволы
        .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
        .replace(/-+/g, '-') // Заменяем множественные дефисы на один
        .replace(/^-|-$/g, ''); // Удаляем дефисы по краям
    },

    /**
     * Парсит дату из строки вида "Февраль 2023" или "Январь 2024"
     * @param {string} dateStr - строка даты
     * @returns {{year: string, month: string}} объект с годом и месяцем
     */
    parseDate(dateStr) {
      if (!dateStr) return { year: new Date().getFullYear().toString(), month: '01' };
      
      const parts = dateStr.trim().split(/\s+/);
      const monthName = parts[0].toLowerCase();
      const year = parts[1] || new Date().getFullYear().toString();
      
      const month = this._months[monthName] || '01';
      return { year, month };
    },

    /**
     * Создаёт короткий slug для новости (без ID)
     * @param {string} title - заголовок новости
     * @returns {string} slug
     */
    createShortSlug(title) {
      return this.generateSlug(title);
    },

    /**
     * Генерирует полную ссылку на новость в формате:
     * news.html/YYYY/MM/DD/slug
     * @param {Object} news - объект новости с полями title, id, date
     * @param {string} baseUrl - базовый URL (по умолчанию news.html)
     * @returns {string} полная ссылка на новость
     */
    generateNewsLink(news, baseUrl = 'news.html') {
      if (!news || !news.title) return baseUrl;
      
      const { year, month } = this.parseDate(news.date);
      const slug = this.createShortSlug(news.title);
      
      // Используем первый день месяца как день публикации
      const day = '01';
      
      return `${baseUrl}/${year}/${month}/${day}/${slug}`;
    },

    /**
     * Создаёт slug для новости с ID для использования в хеше
     * Формат: slug-id (например: poluchenie-sertifikata-2022001)
     * @param {string} title - заголовок новости
     * @param {number} id - ID новости
     * @returns {string} slug с ID
     */
    createNewsSlug(title, id) {
      const shortSlug = this.createShortSlug(title);
      return `${shortSlug}-${id}`;
    },

    /**
     * Извлекает ID новости из slug
     * @param {string} slug - slug в формате slug-id
     * @returns {number|null} ID новости или null если не найдено
     */
    extractNewsIdFromSlug(slug) {
      if (!slug) return null;
      const lastDashIndex = slug.lastIndexOf('-');
      if (lastDashIndex === -1) return null;
      
      const idStr = slug.substring(lastDashIndex + 1);
      const newsId = parseInt(idStr, 10);
      
      return isNaN(newsId) ? null : newsId;
    },

    /**
     * Парсит путь вида /YYYY/MM/DD/slug и возвращает данные
     * @param {string} path - путь относительно текущего домена
     * @returns {{year: string, month: string, day: string, slug: string}|null}
     */
    parseNewsPath(path) {
      if (!path || path.length < 2) return null;
      
      // Убираем ведущий слэш и базовый путь (news.html)
      let cleanPath = path.replace(/^\/+/, '');
      if (cleanPath.startsWith('news.html/')) {
        cleanPath = cleanPath.replace('news.html/', '');
      }
      
      const parts = cleanPath.split('/');
      if (parts.length < 4) return null;
      
      const [year, month, day, ...slugParts] = parts;
      const slug = slugParts.join('/');
      
      // Проверяем что год, месяц и день - числа
      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return null;
      }
      
      return { year, month, day, slug };
    }
  };

  return { DOM, Sanitizer, Validator, PhoneFormatter, RateLimiter, SlugUtils };
})();

// Экспортируем в глобальную область
window.Utils = Utils;
window.DOM = Utils.DOM;
window.Sanitizer = Utils.Sanitizer;
window.Validator = Utils.Validator;
window.PhoneFormatter = Utils.PhoneFormatter;
window.RateLimiter = Utils.RateLimiter;
window.SlugUtils = Utils.SlugUtils;

/**
 * NewsNavigation - Управление URL новостей (DRY & KISS)
 * Синхронизирует состояние приложения с адресной строкой.
 */
const NewsNavigation = {
    basePath: '',
    newsManager: null,

    init(newsManager) {
        this.newsManager = newsManager;
        this.basePath = window.location.pathname.split('/').slice(0, -1).join('/') + '/';
        
        // Обработка кнопок "Назад/Вперед"
        window.addEventListener('popstate', (e) => {
            if (e.state?.newsId) {
                this.newsManager.openNewsModal(e.state.newsId, false);
            } else {
                this.newsManager.closeNewsModal();
            }
        });

        // Проверка прямого захода по ссылке
        this.checkDirectLink();
    },

    checkDirectLink() {
        const path = window.location.pathname;
        const match = path.match(/\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/);
        if (!match) return;

        const slugPart = match[4];
        const lastDashIndex = slugPart.lastIndexOf('-');
        if (lastDashIndex <= 0) return;

        const id = parseInt(slugPart.slice(lastDashIndex + 1), 10);
        if (!isNaN(id)) {
            setTimeout(() => this.newsManager.openNewsModal(id, false), 50);
        }
    },

    openNewsUrl(id, title) {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const slug = `${SlugUtils.generateSlug(title)}-${id}`;
        
        history.pushState({ newsId: id }, '', `/${yyyy}/${mm}/${dd}/${slug}`);
    },

    restoreBaseUrl() {
        history.replaceState(null, '', this.basePath);
    }
};

window.NewsNavigation = NewsNavigation;
