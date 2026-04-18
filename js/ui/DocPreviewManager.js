/**
 * DocPreviewManager - Управление превью PDF документов
 * Следует принципам DRY, KISS и безопасности
 */

class DocPreviewManager {
  constructor() {
    this.renderedCanvases = new Set();
    this.allowedDomains = [
      window.location.origin,
      'https://api.volga-dnepr-engineering.ru'
    ];
  }

  /**
   * Проверяет безопасность URL
   * @param {string} url - URL для проверки
   * @returns {boolean} - true если URL безопасен
   */
  isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Разрешаем относительные пути
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    try {
      const parsed = new URL(url, window.location.origin);
      return this.allowedDomains.some(domain => parsed.origin === domain);
    } catch (e) {
      return false;
    }
  }

  /**
   * Инициализация менеджера превью
   */
  init() {
    if (typeof pdfjsLib === 'undefined') {
      console.warn('PDF.js не загружен. Превью PDF не будут отображаться.');
      return;
    }

    const canvases = document.querySelectorAll('.pdf-canvas[data-pdf-src]');
    
    // Используем IntersectionObserver для ленивой загрузки
    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const canvas = entry.target;
          const pdfSrc = canvas.getAttribute('data-pdf-src');
          
          if (pdfSrc && !this.renderedCanvases.has(canvas)) {
            if (this.isSafeUrl(pdfSrc)) {
              this.renderPDFPreview(canvas, pdfSrc);
              this.renderedCanvases.add(canvas);
            } else {
              console.warn('Небезопасный URL PDF:', pdfSrc);
              this.showError(canvas);
            }
            observer.unobserve(canvas);
          }
        }
      });
    }, observerOptions);

    canvases.forEach(canvas => observer.observe(canvas));
    
    if (typeof Logger !== 'undefined') {
      Logger.INFO(`DocPreviewManager initialized: ${canvases.length} PDF превью`);
    }
  }

  /**
   * Рендерит превью одного PDF файла на canvas
   * @param {HTMLCanvasElement} canvas - элемент canvas для рендеринга
   * @param {string} pdfSrc - путь к PDF файлу
   */
  renderPDFPreview(canvas, pdfSrc) {
    const placeholder = canvas.nextElementSibling;
    
    // Показываем placeholder во время загрузки
    if (placeholder && placeholder.classList.contains('pdf-preview-placeholder')) {
      placeholder.style.display = 'flex';
    }

    pdfjsLib.getDocument(pdfSrc).promise
      .then(pdf => pdf.getPage(1))
      .then(page => {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY) * 0.9;
        
        const scaledViewport = page.getViewport({ scale: scale });
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: scaledViewport
        };
        
        return page.render(renderContext).promise;
      })
      .then(() => {
        canvas.classList.add('loaded');
        if (placeholder && placeholder.classList.contains('pdf-preview-placeholder')) {
          placeholder.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Ошибка рендеринга PDF превью:', pdfSrc, error);
        this.showError(canvas);
      });
  }

  /**
   * Показывает ошибку при неудачной загрузке
   * @param {HTMLCanvasElement} canvas - элемент canvas
   */
  showError(canvas) {
    canvas.style.display = 'none';
    const placeholder = canvas.nextElementSibling;
    if (placeholder && placeholder.classList.contains('pdf-preview-placeholder')) {
      placeholder.style.display = 'flex';
      const icon = placeholder.querySelector('.doc-icon');
      if (icon) icon.style.fill = '#dc3545';
    }
  }
}

// Экспортируем глобально как синглтон
window.DocPreviewManager = new DocPreviewManager();
