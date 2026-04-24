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

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        latestNews.forEach((news, index) => {
            const card = createNewsCard(news, index);
            fragment.appendChild(card);
        });
        
        container.appendChild(fragment);

        // Запускаем lazy loading и анимацию
        lazyLoadImages(container);
        animateCards(container);

        // Делегирование кликов
        container.addEventListener('click', (e) => {
          const link = e.target.closest('.news-card-link');
          if (link && link.dataset.newsId && window.newsManager) {
            e.preventDefault();
            window.newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
          }
        });
    }

    // Создание карточки новости (аналогично NewsRenderer._createNewsCard)
    function createNewsCard(news, index) {
        const article = document.createElement('article');
        article.classList.add('news-card');
        article.style.animationDelay = `${index * 50}ms`;
        
        // Создаем элементы через DOM API вместо innerHTML для безопасности
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('news-card-image');
        
        const placeholder = document.createElement('div');
        placeholder.classList.add('image-placeholder');
        
        const img = document.createElement('img');
        // Используем реальное изображение из новости или placeholder по умолчанию
        const imageUrl = news.image && news.image.trim() !== '' ? news.image : 'assets/images/placeholder.jpg';
        img.setAttribute('data-src', Utils.Sanitizer.escapeHtml(imageUrl));
        img.setAttribute('alt', Utils.Sanitizer.escapeHtml(news.title));
        img.setAttribute('loading', 'lazy');
        img.addEventListener('error', function() { this.src = 'assets/images/placeholder.jpg'; });
        
        const category = document.createElement('span');
        category.classList.add('news-card-category');
        category.textContent = Utils.Sanitizer.escapeHtml(news.category);
        
        imageContainer.appendChild(placeholder);
        imageContainer.appendChild(img);
        imageContainer.appendChild(category);
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('news-card-content');
        
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('news-card-date');
        
        // Добавляем SVG иконку через DOM API
        const dateSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        dateSvg.setAttribute('viewBox', '0 0 24 24');
        const datePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        datePath.setAttribute('d', 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z');
        dateSvg.appendChild(datePath);
        dateDiv.appendChild(dateSvg);
        
        const dateText = document.createTextNode(` ${escapeHtml(news.date)}`);
        dateDiv.appendChild(dateText);
        
        const title = document.createElement('h3');
        title.classList.add('news-card-title');
        title.textContent = Utils.Sanitizer.escapeHtml(news.title);
        
        const excerpt = document.createElement('p');
        excerpt.classList.add('news-card-excerpt');
        excerpt.textContent = Utils.Sanitizer.escapeHtml(news.excerpt);
        
        const link = document.createElement('a');
        link.classList.add('news-card-link');
        link.setAttribute('href', '#');
        link.setAttribute('data-news-id', news.id);
        link.textContent = 'Подробнее';
        
        // Добавляем SVG иконку через DOM API
        const linkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        linkSvg.setAttribute('viewBox', '0 0 24 24');
        const linkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        linkPath.setAttribute('d', 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z');
        linkSvg.appendChild(linkPath);
        link.appendChild(linkSvg);
        
        contentDiv.appendChild(dateDiv);
        contentDiv.appendChild(title);
        contentDiv.appendChild(excerpt);
        contentDiv.appendChild(link);
        
        article.appendChild(imageContainer);
        article.appendChild(contentDiv);
        
        return article;
    }

    // Lazy loading изображений (аналогично NewsRenderer._lazyLoadImages)
    function lazyLoadImages(container) {
        const images = container.querySelectorAll('.news-card-image img');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src && !img.src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.onload = () => {
                            img.classList.add('loaded');
                            const placeholder = img.parentElement?.querySelector('.image-placeholder');
                            if (placeholder) placeholder.style.display = 'none';
                        };
                        img.onerror = () => {
                            Logger.WARN('Failed to load image:', src);
                            img.src = 'assets/images/placeholder.jpg';
                            img.classList.add('loaded');
                        };
                    }
                    observer.unobserve(img);
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });
        
        images.forEach(img => observer.observe(img));
    }

    // Анимация карточек (аналогично NewsRenderer._animateCards)
    function animateCards(container) {
        const cards = container.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, index * 50);
        });
    }

    // Утилита для экранирования HTML (аналогично NewsRenderer._escapeHtml)
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ---- Остальные обработчики (кнопки, форма, телефон) ----
    document.addEventListener('DOMContentLoaded', function() {
        // Кнопки "Запросить КП" - универсальный обработчик через data-modal-open
        document.querySelectorAll('[data-modal-open="proposal"]').forEach(btn => {
            btn.addEventListener('click', () => window.openModal?.());
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