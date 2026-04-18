/**
 * DocPreviewManager - Управление превью PDF документов
 * Следует принципам DRY и KISS
 */

class DocPreviewManager {
  constructor() {
    this.frames = [];
  }

  init() {
    const frames = document.querySelectorAll('.pdf-frame');
    
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
            Logger.INFO(`Ленивая загрузка PDF: ${src}`);
            frame.src = src;
            
            frame.addEventListener('load', () => {
              frame.classList.add('loaded');
            });
            
            // Принудительно показываем placeholder если iframe не загрузился за 3 секунды
            setTimeout(() => {
              if (!frame.classList.contains('loaded')) {
                Logger.WARN(`PDF превью не загрузилось за 3с: ${src}`);
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
    
    Logger.INFO('DocPreviewManager initialized with lazy loading');
  }
}

// Экспортируем глобально
window.DocPreviewManager = new DocPreviewManager();
