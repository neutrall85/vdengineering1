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
            container.innerHTML = '<p class="no-news">Новости временно недоступны</p>';
            return;
        }

        // Функция для парсинга даты из строки вида "Месяц YYYY"
        function parseDate(dateStr) {
            const months = {
                'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3, 'май': 4, 'июнь': 5,
                'июль': 6, 'август': 7, 'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
            };
            const parts = dateStr.toLowerCase().split(' ');
            const month = months[parts[0]];
            const year = parseInt(parts[1], 10);
            if (isNaN(year) || month === undefined) return new Date(0);
            return new Date(year, month);
        }

        const allNews = Object.values(NEWS_DATA).flat();
        // Сортируем по реальной дате (от новых к старым)
        const latestNews = allNews.sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 3);

        if (latestNews.length === 0) {
            container.innerHTML = '<p class="no-news">Нет новостей</p>';
            return;
        }

        // Используем единый NewsRenderer для создания карточек
        const renderer = new NewsRenderer(NEWS_DATA);
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        latestNews.forEach((news, index) => {
            const card = renderer._createNewsCard(news, index);
            // Для превью меняем ссылку на заглушку и добавляем data-news-id
            const link = card.querySelector('.news-card-link');
            if (link) {
                link.setAttribute('href', '#');
                link.setAttribute('data-news-id', news.id);
            }
            fragment.appendChild(card);
        });
        
        container.appendChild(fragment);

        // Запускаем lazy loading и анимацию через методы рендерера
        renderer._lazyLoadImages(container);
        renderer._animateCards(container);

        // Делегирование кликов
        container.addEventListener('click', (e) => {
          const link = e.target.closest('.news-card-link');
          if (link && link.dataset.newsId && window.newsManager) {
            e.preventDefault();
            window.newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
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

        // Автодобавление +7 к телефону
        const setupPhonePrefix = (input) => {
            if (!input) return;
            input.addEventListener('blur', () => {
                if (window.Utils?.PhoneUtils) {
                    input.value = window.Utils.PhoneUtils.addPrefix(input.value);
                } else {
                    let v = input.value.trim();
                    if (v && !v.startsWith('+') && !v.startsWith('8') && v.length >= 10) input.value = '+7' + v;
                    else if (v.startsWith('8') && v.length > 1) input.value = '+7' + v.substring(1);
                }
            });
        };
        // Телефон больше не используется на странице - форма переехала в модалку

        // Запуск рендера новостей с небольшой задержкой (ждём загрузки NEWS_DATA и DOM)
        setTimeout(renderPreviewNews, 200);
    });
})();