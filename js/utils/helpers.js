/**
 * initDocPreviews - Ленивая загрузка PDF превью
 * Упрощенная функция вместо класса DocPreviewManager
 * Следует принципу KISS
 */

// Хранилище для обработчиков и наблюдателя
const _docPreviewsState = {
  observer: null,
  loadHandlerMap: new Map()
};

function initDocPreviews() {
  const frames = document.querySelectorAll('.pdf-frame');
  
  if (frames.length === 0) {
    return;
  }
  
  // Используем IntersectionObserver для ленивой загрузки PDF
  const observerOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  };

  _docPreviewsState.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const frame = entry.target;
        const src = frame.getAttribute('data-src');
        
        if (src && !frame.src) {
          if (window.Logger) {
            Logger.INFO(`Ленивая загрузка PDF: ${src}`);
          }
          frame.src = src;
          
          const loadHandler = () => {
            frame.classList.add('loaded');
          };
          
          frame.addEventListener('load', loadHandler);
          _docPreviewsState.loadHandlerMap.set(frame, loadHandler);
          
          // Принудительно показываем placeholder если iframe не загрузился за 3 секунды
          setTimeout(() => {
            if (!frame.classList.contains('loaded')) {
              if (window.Logger) {
                Logger.WARN(`PDF превью не загрузилось за 3с: ${src}`);
              }
            }
          }, 3000);
          
          _docPreviewsState.observer.unobserve(frame);
        }
      }
    });
  }, observerOptions);

  frames.forEach(frame => {
    _docPreviewsState.observer.observe(frame);
  });
  
  if (window.Logger) {
    Logger.INFO('initDocPreviews: lazy loading initialized for', frames.length, 'frames');
  }
}

/**
 * Очистка ресурсов превью документов
 */
function destroyDocPreviews() {
  if (_docPreviewsState.observer) {
    _docPreviewsState.observer.disconnect();
    _docPreviewsState.observer = null;
  }
  
  if (_docPreviewsState.loadHandlerMap) {
    _docPreviewsState.loadHandlerMap.forEach((handler, frame) => {
      frame.removeEventListener('load', handler);
    });
    _docPreviewsState.loadHandlerMap.clear();
  }
}

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
  window.initDocPreviews = initDocPreviews;
  window.destroyDocPreviews = destroyDocPreviews;
}
