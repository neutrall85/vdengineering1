/**
 * Инициализация главной страницы
 * ООО "Волга-Днепр Инжиниринг"
 */

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
        container.addEventListener('click', (e) => {
          const link = e.target.closest('.news-card-link');
          if (link && link.dataset.newsId && typeof newsManager !== 'undefined') {
            e.preventDefault();
            newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
          }
        });
    }

    // ---- Остальные обработчики (кнопки, телефон) ----
    document.addEventListener('DOMContentLoaded', function() {
        // Кнопки "Запросить КП" обрабатываются глобально в app.js через data-modal-open

        // Email ссылка
        const emailLink = document.getElementById('contactEmailLink');
        emailLink?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Открыть почтовый клиент?')) location.href = emailLink.href;
        });

        // Плавающая CTA кнопка обрабатывается в app.js

        // Кнопка "Наверх" обрабатывается в app.js

        // Запуск рендера новостей с небольшой задержкой (ждём загрузки NEWS_DATA и DOM)
        setTimeout(renderPreviewNews, 200);
    });
})();