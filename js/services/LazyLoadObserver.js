/**
 * LazyLoadObserver - единый сервис для ленивой загрузки через Intersection Observer
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Объединяет наблюдатели для:
 * - Анимаций при скролле
 * - Ленивой загрузки изображений
 * - Превью новостей
 * - PDF превью
 */

const LazyLoadObserver = (function() {
  // Конфигурация по умолчанию
  const defaultConfig = {
    rootMargin: '50px',
    threshold: 0.1
  };

  // Хранилище наблюдателей для разных типов элементов
  const observers = new Map();
  
  // Хранилище обработанных элементов для избежания повторной обработки
  const processedElements = new WeakSet();

  /**
   * Создание нового Intersection Observer
   * @param {string} type - тип наблюдателя (image, animation, preview, pdf)
   * @param {Function} callback - функция обратного вызова при пересечении
   * @param {Object} options - опции наблюдателя
   */
  function createObserver(type, callback, options = {}) {
    const config = { ...defaultConfig, ...options };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Если элемент уже обработан, пропускаем
          if (processedElements.has(element)) return;
          
          callback(element, entry);
          
          // Прекращаем наблюдение после первой активации
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: config.rootMargin,
      threshold: config.threshold
    });

    observers.set(type, observer);
    return observer;
  }

  /**
   * Наблюдение за изображениями для ленивой загрузки
   * @param {NodeList|Array} images - коллекция img элементов с data-src
   */
  function observeImages(images) {
    if (!images || images.length === 0) return;

    let observer = observers.get('image');
    if (!observer) {
      observer = createObserver('image', (img) => {
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
      });
    }

    Array.from(images).forEach(img => {
      if (!processedElements.has(img)) {
        processedElements.add(img);
        observer.observe(img);
      }
    });
  }

  /**
   * Наблюдение за элементами для анимаций
   * @param {NodeList|Array} elements - коллекция элементов с классом fade-in или подобным
   * @param {string} className - класс для добавления при появлении
   */
  function observeAnimations(elements, className = 'visible') {
    if (!elements || elements.length === 0) return;

    let observer = observers.get('animation');
    if (!observer) {
      observer = createObserver('animation', (element) => {
        element.classList.add(className);
      });
    }

    Array.from(elements).forEach(el => {
      if (!processedElements.has(el)) {
        processedElements.add(el);
        observer.observe(el);
      }
    });
  }

  /**
   * Наблюдение за превью новостей/PDF
   * @param {NodeList|Array} elements - коллекция элементов для превью
   * @param {Function} callback - функция обработки элемента
   */
  function observePreviews(elements, callback) {
    if (!elements || elements.length === 0 || typeof callback !== 'function') return;

    let observer = observers.get('preview');
    if (!observer) {
      observer = createObserver('preview', callback);
    }

    Array.from(elements).forEach(el => {
      if (!processedElements.has(el)) {
        processedElements.add(el);
        observer.observe(el);
      }
    });
  }

  /**
   * Очистка всех наблюдателей
   */
  function disconnectAll() {
    observers.forEach(observer => observer.disconnect());
    observers.clear();
  }

  /**
   * Очистка конкретного наблюдателя по типу
   * @param {string} type - тип наблюдателя
   */
  function disconnect(type) {
    const observer = observers.get(type);
    if (observer) {
      observer.disconnect();
      observers.delete(type);
    }
  }

  return {
    observeImages,
    observeAnimations,
    observePreviews,
    createObserver,
    disconnect,
    disconnectAll
  };
})();

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.LazyLoadObserver = LazyLoadObserver;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoadObserver;
}
