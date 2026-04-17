/**
 * Инициализация главной страницы
 * ООО "Волга-Днепр Инжиниринг"
 */

(function() {
    // ---- Рендер превью новостей ----
    function renderPreviewNews() {
        const container = document.getElementById('previewNewsGrid');
        if (!container) return;

        if (typeof NEWS_DATA === 'undefined') {
            container.innerHTML = '<p class="no-news">Новости временно недоступны</p>';
            return;
        }

        const escape = (window.Utils?.Sanitizer?.escapeHtml) || (str => String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }));

        const allNews = Object.values(NEWS_DATA).flat();
        const latestNews = allNews.sort((a, b) => b.id - a.id).slice(0, 3);

        if (latestNews.length === 0) {
            container.innerHTML = '<p class="no-news">Нет новостей</p>';
            return;
        }

        container.innerHTML = '';
        latestNews.forEach(news => {
            const article = document.createElement('article');
            article.className = 'news-card';
            article.innerHTML = `
                <div class="news-card-image">
                    <div class="image-placeholder"></div>
                    <img data-src="${escape(news.image || 'assets/images/placeholder.jpg')}" 
                        alt="${escape(news.title)}" loading="lazy"
                        onerror="this.src='assets/images/placeholder.jpg'">
                    <span class="news-card-category">${escape(news.category)}</span>
                </div>
                <div class="news-card-content">
                    <div class="news-card-date">
                        <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                        ${escape(news.date)}
                    </div>
                    <h3 class="news-card-title">${escape(news.title)}</h3>
                    <p class="news-card-excerpt">${escape(news.excerpt)}</p>
                    <a href="#" class="news-card-link" data-news-id="${news.id}">Подробнее
                        <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    </a>
                </div>
            `;
            container.appendChild(article);
        });

        // ✅ Добавляем класс loaded для видимости карточек
        container.querySelectorAll('.news-card').forEach(card => card.classList.add('loaded'));

        // Делегирование кликов
        container.addEventListener('click', (e) => {
            const link = e.target.closest('.news-card-link');
            if (link && link.dataset.newsId && window.newsManager) {
                e.preventDefault();
                window.newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
            }
        });
    }

    // ---- Остальные обработчики (кнопки, форма, телефон) ----
    document.addEventListener('DOMContentLoaded', function() {
        // Кнопки "Запросить КП"
        ['heroRequestQuoteBtn', 'aboutRequestQuoteBtn', 'servicesRequestQuoteBtn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.addEventListener('click', () => window.openModal?.());
        });

        // Email ссылка
        const emailLink = document.getElementById('contactEmailLink');
        emailLink?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Открыть почтовый клиент?')) location.href = emailLink.href;
        });

        // Плавающая CTA кнопка
        document.getElementById('floatingCtaBtn')?.addEventListener('click', () => window.openModal?.());

        // Кнопка "Наверх"
        document.getElementById('scrollToTop')?.addEventListener('click', () => window.scrollToTop?.());

        // Клонирование формы в модальное окно
        const originalForm = document.getElementById('commercial-offer');
        const modalBody = document.getElementById('modalBodyContainer');
        if (originalForm && modalBody) {
            const formClone = originalForm.cloneNode(true);
            formClone.removeAttribute('id');
            modalBody.innerHTML = '';
            modalBody.appendChild(formClone);
            // Убираем дублирующиеся ID
            modalBody.querySelectorAll('[id]').forEach(el => {
                if (!['proposalForm', 'submitBtn', 'fileAttachment', 'fileDrop', 'fileList', 'phone'].includes(el.id)) {
                    el.removeAttribute('id');
                } else {
                    if (el.id === 'phone') el.classList.add('modal-phone-input');
                    if (el.id === 'fileDrop') el.classList.add('modal-file-drop');
                }
            });
            modalBody.querySelector('.rate-limit-warning')?.classList.remove('show');
            modalBody.querySelector('.success-message')?.classList.remove('show');
        }

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
        setupPhonePrefix(document.getElementById('phone'));
        // Для телефона в модалке (появится позже, используем MutationObserver или просто отложенный вызов)
        setTimeout(() => setupPhonePrefix(document.querySelector('#modalOverlay #phone')), 200);

        // Запуск рендера новостей с небольшой задержкой (ждём загрузки NEWS_DATA и DOM)
        setTimeout(renderPreviewNews, 200);
    });
})();