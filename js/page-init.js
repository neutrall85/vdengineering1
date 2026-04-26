/**
 * Инициализация главной страницы
 * ООО "Волга-Днепр Инжиниринг"
 */

// Хранилище для обработчиков главной страницы
const _mainPageHandlers = {
  containerClickHandler: null,
  emailClickHandler: null
};

(function() {
    // ---- Рендер превью новостей через единый NewsRenderer ----
    function renderPreviewNews() {
        const container = document.getElementById('previewNewsGrid');
        if (!container) return;

        if (typeof NEWS_DATA === 'undefined' || typeof NewsRenderer === 'undefined') {
            const errorMsg = document.createElement('p');
            errorMsg.className = 'no-news';
            errorMsg.textContent = 'Новости временно недоступны';
            container.replaceChildren();
            container.appendChild(errorMsg);
            return;
        }

        // Используем публичный API NewsRenderer.renderPreview
        const renderer = new NewsRenderer(NEWS_DATA);
        renderer.renderPreview(container, 3);

        // Делегирование кликов
        _mainPageHandlers.containerClickHandler = (e) => {
          const link = e.target.closest('.news-card-link');
          if (link && link.dataset.newsId && typeof newsManager !== 'undefined') {
            e.preventDefault();
            newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
          }
        };
        container.addEventListener('click', _mainPageHandlers.containerClickHandler);
    }

    // ---- Остальные обработчики (кнопки, телефон) ----
    document.addEventListener('DOMContentLoaded', function() {
        // Кнопки "Запросить КП" обрабатываются глобально в app.js через data-modal-open

        // Email ссылка
        const emailLink = document.getElementById('contactEmailLink');
        _mainPageHandlers.emailClickHandler = (e) => {
            e.preventDefault();
            if (confirm('Открыть почтовый клиент?')) location.href = emailLink.href;
        };
        emailLink?.addEventListener('click', _mainPageHandlers.emailClickHandler);

        // Плавающая CTA кнопка обрабатывается в app.js

        // Кнопка "Наверх" обрабатывается в app.js

        // Запуск рендера новостей с небольшой задержкой (ждём загрузки NEWS_DATA и DOM)
        setTimeout(renderPreviewNews, 200);
    });
    
    // Экспортируем функцию очистки для главной страницы
    window.destroyMainPage = function() {
      // Удаляем обработчик контейнера новостей
      const container = document.getElementById('previewNewsGrid');
      if (container && _mainPageHandlers.containerClickHandler) {
        container.removeEventListener('click', _mainPageHandlers.containerClickHandler);
        _mainPageHandlers.containerClickHandler = null;
      }
      
      // Удаляем обработчик email ссылки
      const emailLink = document.getElementById('contactEmailLink');
      if (emailLink && _mainPageHandlers.emailClickHandler) {
        emailLink.removeEventListener('click', _mainPageHandlers.emailClickHandler);
        _mainPageHandlers.emailClickHandler = null;
      }
    };
})();