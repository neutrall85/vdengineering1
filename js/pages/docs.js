/**
 * Инициализация обработчиков для страницы документов
 * ООО "Волга-Днепр Инжиниринг"
 */

// Функция инициализации (без export, так как это не модуль)
function initDocsPage() {
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

  // Ленивая загрузка изображений превью с использованием Intersection Observer
  const previewImages = document.querySelectorAll('.doc-preview-image');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          // Изображение уже начнет загружаться браузером благодаря loading="lazy"
          // Здесь можно добавить дополнительную логику если needed
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Начинать загрузку заранее (50px до видимости)
      threshold: 0.01
    });

    previewImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Обработка ошибок загрузки изображений превью
  previewImages.forEach(img => {
    img.addEventListener('error', function() {
      // Если изображение не загрузилось, показываем placeholder
      const docType = this.getAttribute('data-doc-type') || 'PDF';
      const placeholder = document.createElement('div');
      placeholder.className = 'pdf-preview-placeholder';
      placeholder.replaceChildren();
      
      // Создаем SVG через DOM API
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.className = 'doc-icon';
      
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z');
      
      svg.appendChild(path);
      
      const span = document.createElement('span');
      span.className = 'doc-type';
      span.textContent = docType;
      
      placeholder.appendChild(svg);
      placeholder.appendChild(span);
      this.parentElement.appendChild(placeholder);
      this.style.display = 'none';
    });
  });
}

// Автозапуск если не используется как модуль, или ожидание DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDocsPage);
} else {
  initDocsPage();
}
