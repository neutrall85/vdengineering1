/**
 * initDocPreviews - Ленивая загрузка PDF превью
 * Упрощенная функция вместо класса DocPreviewManager
 * Следует принципу KISS
 */

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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const frame = entry.target;
        const src = frame.getAttribute('data-src');
        
        if (src && !frame.src) {
          if (window.Logger) {
            Logger.INFO(`Ленивая загрузка PDF: ${src}`);
          }
          frame.src = src;
          
          frame.addEventListener('load', () => {
            frame.classList.add('loaded');
          });
          
          // Принудительно показываем placeholder если iframe не загрузился за 3 секунды
          setTimeout(() => {
            if (!frame.classList.contains('loaded')) {
              if (window.Logger) {
                Logger.WARN(`PDF превью не загрузилось за 3с: ${src}`);
              }
            }
          }, 3000);
          
          observer.unobserve(frame);
        }
      }
    });
  }, observerOptions);

  frames.forEach(frame => {
    observer.observe(frame);
  });
  
  if (window.Logger) {
    Logger.INFO('initDocPreviews: lazy loading initialized for', frames.length, 'frames');
  }
}

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
  window.initDocPreviews = initDocPreviews;
}
