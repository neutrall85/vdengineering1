/**
 * NewsCardRenderer
 * Отвечает исключительно за создание DOM-элемента карточки новости.
 * Принципы: DRY, KISS, CSP-safe (нет innerHTML с пользовательскими данными, нет инлайн-событий).
 */

class NewsCardRenderer {
    /**
     * Создает DOM-элемент карточки новости
     * @param {Object} news - Объект данных новости
     * @returns {HTMLElement} - Готовый DOM-элемент article
     */
    static createCard(news) {
        const article = document.createElement('article');
        article.className = 'news-card';
        article.setAttribute('data-news-id', news.id);

        // Создаем изображение безопасно
        const imgContainer = document.createElement('div');
        imgContainer.className = 'news-card__image-wrapper';

        const img = document.createElement('img');
        img.className = 'news-card__image';
        img.alt = news.title || 'Изображение новости';
        
        // Используем заглушку, если изображения нет
        if (news.image) {
            img.src = news.image;
        } else {
            img.src = 'assets/images/placeholder.jpg';
        }

        // Безопасная обработка ошибки загрузки изображения (вместо onerror в HTML)
        img.addEventListener('error', function() {
            this.src = 'assets/images/placeholder.jpg';
            this.alt = 'Изображение недоступно';
        });

        imgContainer.appendChild(img);
        article.appendChild(imgContainer);

        // Контент карточки
        const content = document.createElement('div');
        content.className = 'news-card__content';

        // Дата
        const dateEl = document.createElement('span');
        dateEl.className = 'news-card__date';
        dateEl.textContent = this._formatDate(news.date);
        content.appendChild(dateEl);

        // Заголовок
        const titleEl = document.createElement('h3');
        titleEl.className = 'news-card__title';
        titleEl.textContent = news.title;
        content.appendChild(titleEl);

        // Описание (excerpt)
        if (news.excerpt) {
            const excerptEl = document.createElement('p');
            excerptEl.className = 'news-card__excerpt';
            excerptEl.textContent = news.excerpt;
            content.appendChild(excerptEl);
        }

        article.appendChild(content);

        // Ссылка "Читать далее"
        const linkWrapper = document.createElement('div');
        linkWrapper.className = 'news-card__footer';

        const link = document.createElement('a');
        link.className = 'news-card__link';
        link.href = `news.html?id=${news.id}`;
        link.textContent = 'Читать далее';
        link.setAttribute('aria-label', `Читать новость: ${news.title}`);
        
        linkWrapper.appendChild(link);
        article.appendChild(linkWrapper);

        return article;
    }

    /**
     * Форматирует дату в читаемый вид
     * @param {string|Date} dateInput 
     * @returns {string}
     */
    static _formatDate(dateInput) {
        if (!dateInput) return '';
        
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        
        if (isNaN(date.getTime())) {
            return dateInput; // Возвращаем как есть, если не валидная дата
        }

        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

window.NewsCardRenderer = NewsCardRenderer;
