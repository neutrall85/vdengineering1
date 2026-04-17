/**
 * NewsNavigation - Роутинг новостей через History API
 * Обработка прямых ссылок вида /news/2023/09/article-slug
 * Следует принципам DRY и KISS
 */

class NewsNavigation {
  constructor() {
    this.newsManager = null;
    this.currentNewsId = null;
  }

  /**
   * Инициализация навигации
   * @param {Object} newsManager - Экземпляр NewsManager
   */
  init(newsManager) {
    this.newsManager = newsManager;
    
    // Обработка кнопки "Назад" в браузере
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.type === 'news') {
        this._openNewsFromState(event.state.newsId);
      } else {
        this._closeNewsModal();
      }
    });

    // Обработка прямой ссылки при загрузке страницы
    this._handleDirectLink();

    Logger.INFO('NewsNavigation initialized');
  }

  /**
   * Обработка прямой ссылки при загрузке страницы
   */
  _handleDirectLink() {
    const path = window.location.pathname;
    const newsMatch = path.match(/^\/news\/(\d{4})\/(\d{2})\/(.+)$/);
    
    if (newsMatch) {
      const [, year, month, slug] = newsMatch;
      Logger.INFO(`Прямая ссылка на новость: ${year}/${month}/${slug}`);
      
      // Находим новость по slug или дате
      if (this.newsManager && this.newsManager.newsData) {
        const newsItem = this._findNewsBySlug(year, month, slug);
        if (newsItem) {
          // Небольшая задержка чтобы убедиться что DOM готов
          setTimeout(() => {
            this.openNewsUrl(newsItem.id, newsItem.title);
          }, 100);
        } else {
          Logger.WARN(`Новость не найдена: ${year}/${month}/${slug}`);
        }
      }
    }
  }

  /**
   * Поиск новости по slug
   * @param {string} year - Год
   * @param {string} month - Месяц
   * @param {string} slug - Slug новости
   * @returns {Object|null} Найденная новость или null
   */
  _findNewsBySlug(year, month, slug) {
    if (!this.newsManager || !this.newsManager.newsData) {
      return null;
    }

    // Пытаемся найти по slug в URL
    const newsList = this.newsManager.newsData;
    
    for (const news of newsList) {
      // Проверяем дату новости
      const newsDate = new Date(news.date);
      const newsYear = newsDate.getFullYear().toString();
      const newsMonth = (newsDate.getMonth() + 1).toString().padStart(2, '0');
      
      if (newsYear === year && newsMonth === month) {
        // Генерируем slug из заголовка
        const generatedSlug = this._generateSlug(news.title);
        if (generatedSlug === slug || news.id.toString() === slug) {
          return news;
        }
      }
    }
    
    return null;
  }

  /**
   * Генерация slug из заголовка
   * @param {string} title - Заголовок новости
   * @returns {string} Slug
   */
  _generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^а-яёa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Открытие новости с обновлением URL
   * @param {number|string} id - ID новости
   * @param {string} title - Заголовок новости для slug
   */
  openNewsUrl(id, title) {
    if (!this.newsManager) {
      Logger.ERROR('NewsManager не инициализирован');
      return;
    }

    const newsItem = this.newsManager.newsData.find(n => n.id === id);
    if (!newsItem) {
      Logger.ERROR(`Новость с ID ${id} не найдена`);
      return;
    }

    const date = new Date(newsItem.date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const slug = this._generateSlug(title);

    const url = `/news/${year}/${month}/${slug}`;
    
    // Добавляем запись в историю браузера
    history.pushState(
      { type: 'news', newsId: id },
      newsItem.title,
      url
    );

    this.currentNewsId = id;
    
    // Открываем модальное окно
    this.newsManager.openModal(id, false);
    
    Logger.INFO(`Открыта новость: ${url}`);
  }

  /**
   * Открытие новости из состояния истории
   * @param {number|string} id - ID новости
   */
  _openNewsFromState(id) {
    if (this.newsManager) {
      this.currentNewsId = id;
      this.newsManager.openModal(id, false);
      Logger.INFO(`Восстановлено состояние новости: ${id}`);
    }
  }

  /**
   * Закрытие модального окна новости
   */
  _closeNewsModal() {
    if (this.newsManager) {
      this.newsManager.closeModal();
      this.currentNewsId = null;
      Logger.INFO('Модальное окно новости закрыто');
    }
  }

  /**
   * Очистка состояния
   */
  destroy() {
    this.newsManager = null;
    this.currentNewsId = null;
  }

  /**
   * Восстановление базового URL (удаление news slug из пути)
   * Вызывается при закрытии модального окна новости
   */
  restoreBaseUrl() {
    if (this.currentNewsId) {
      // Очищаем состояние истории
      history.replaceState({}, '', '/news.html');
      this.currentNewsId = null;
      Logger.INFO('URL восстановлен к /news.html');
    }
  }
}

// Экспортируем глобально
window.NewsNavigation = new NewsNavigation();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NewsNavigation };
}
