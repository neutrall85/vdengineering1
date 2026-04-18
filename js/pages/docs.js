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
      // Можно добавить дополнительную логику при клике на просмотр документа
      // Например, аналитику или логирование
      if (typeof Logger !== 'undefined') {
        Logger.INFO('Просмотр документа:', this.href);
      }
    });
  });

  // Инициализация PDF preview (переключение между iframe и placeholder)
  const pdfFrames = document.querySelectorAll('.pdf-frame');
  
  pdfFrames.forEach(function(frame) {
    frame.addEventListener('load', function() {
      const placeholder = this.nextElementSibling;
      if (placeholder && placeholder.classList.contains('pdf-preview-placeholder')) {
        // Если PDF загрузился успешно, скрываем placeholder
        placeholder.style.display = 'none';
      }
    });

    frame.addEventListener('error', function() {
      const placeholder = this.nextElementSibling;
      if (placeholder && placeholder.classList.contains('pdf-preview-placeholder')) {
        // Если ошибка загрузки, показываем placeholder
        this.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    });
  });
}

// Автозапуск если не используется как модуль, или ожидание DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDocsPage);
} else {
  initDocsPage();
}
