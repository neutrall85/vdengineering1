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
    
    frames.forEach((frame, index) => {
      // Добавляем обработчик загрузки для iframe
      frame.addEventListener('load', () => {
        frame.classList.add('loaded');
      });
      
      // Принудительно показываем placeholder если iframe не загрузился за 3 секунды
      setTimeout(() => {
        if (!frame.classList.contains('loaded')) {
          // Оставляем placeholder видимым
          console.log(`PDF превью ${index + 1} не загрузилось, показываем placeholder`);
        }
      }, 3000);
    });
    
    console.log('DocPreviewManager initialized');
  }
}

// Экспортируем глобально
window.DocPreviewManager = new DocPreviewManager();
