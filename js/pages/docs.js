/**
 * Инициализация обработчиков для страницы документов
 * ООО "Волга-Днепр Инжиниринг"
 */

// Экспортируем функцию инициализации для использования в module режиме
export function initDocsPage() {
  // Обработчик для кнопок просмотра документов
  const docViewLinks = document.querySelectorAll('.doc-view-link');
  
  docViewLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (typeof Logger !== 'undefined') {
        Logger.INFO('Просмотр документа:', this.href);
      }
    });
  });

  // Инициализация DocPreviewManager для рендеринга превью PDF
  if (window.DocPreviewManager) {
    window.DocPreviewManager.init();
  }
}

// Автозапуск если не используется как модуль, или ожидание DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDocsPage);
} else {
  initDocsPage();
}
