/**
 * NewsNavigation - Роутинг новостей через History API
 * Обработка прямых ссылок вида #/news/2023/09/article-slug
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
    const hash = window.location.hash;

    // Проверяем наличие hash-роута вида #/news/YYYY/MM/slug
    const newsMatch = hash.match(/^#\/news\/(\d{4})\/(\d{2})\/(.+)$/);

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
            // Открываем модальное окно вручную, так как openNewsUrl только обновляет URL
            if (this.newsManager) {
              this.newsManager.openNewsModal(newsItem.id, false);
            }
          }, 100);
        } else {
          Logger.WARN(`Новость не найдена: ${year}/${month}/${slug}`);
        }
      } else {
        // Данные ещё не загружены, пробуем позже
        Logger.INFO('Данные новостей ещё не загружены, повторяем попытку...');
        setTimeout(() => this._handleDirectLink(), 200);
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
    // newsData - это объект с годами, поэтому нужно получить все новости через Object.values().flat()
    const allNews = Object.values(this.newsManager.newsData).flat();
    
    for (const news of allNews) {
      // Используем тот же метод парсинга даты что и в NewsRenderer для консистентности
      const { year: newsYear, month: newsMonth } = Utils.SlugUtils ? Utils.SlugUtils.parseDate(news.date) : this._parseDateFallback(news.date);
      
      if (newsYear === year && newsMonth === month) {
        // Генерируем slug из заголовка
        const generatedSlug = Utils.SlugUtils ? Utils.SlugUtils.createShortSlug(news.title) : this._generateSlug(news.title);
        if (generatedSlug === slug || news.id.toString() === slug) {
          return news;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Fallback для парсинга даты если Utils.SlugUtils недоступен
   * @param {string} dateStr - строка даты вида "Январь 2026"
   * @returns {{year: string, month: string}}
   */
  _parseDateFallback(dateStr) {
    if (!dateStr) return { year: '2023', month: '01' };
    
    const months = {
      'январь': '01', 'февраль': '02', 'март': '03', 'апрель': '04',
      'май': '05', 'июнь': '06', 'июль': '07', 'август': '08',
      'сентябрь': '09', 'октябрь': '10', 'ноябрь': '11', 'декабрь': '12'
    };
    
    const parts = dateStr.trim().split(/\s+/);
    const monthName = parts[0].toLowerCase();
    const year = parts[1] || '2023';
    const month = months[monthName] || '01';
    
    return { year, month };
  }

  /**
   * Генерация slug из заголовка
   * Использует централизованную утилиту Utils.SlugUtils для соблюдения DRY
   * @param {string} title - Заголовок новости
   * @returns {string} Slug
   */
  _generateSlug(title) {
    return Utils.SlugUtils ? Utils.SlugUtils.createShortSlug(title) : this._fallbackGenerateSlug(title);
  }
  
  /**
   * Fallback для генерации slug если Utils.SlugUtils недоступен
   * @param {string} title - Заголовок новости
   * @returns {string} Slug
   */
  _fallbackGenerateSlug(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .replace(/[^а-яёa-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Открытие новости с обновлением URL
   * Вызывается из NewsManager.openNewsModal при updateUrl = true
   * @param {number|string} id - ID новости
   * @param {string} title - Заголовок новости для slug
   */
  openNewsUrl(id, title) {
    if (!this.newsManager) {
      Logger.ERROR('NewsManager не инициализирован');
      return;
    }

    // newsData - это объект с годами, поэтому нужно получить все новости через Object.values().flat()
    const allNews = Object.values(this.newsManager.newsData).flat();
    const newsItem = allNews.find(n => n.id === id);
    if (!newsItem) {
      Logger.ERROR(`Новость с ID ${id} не найдена`);
      return;
    }

    // Используем тот же метод парсинга даты что и в NewsRenderer для консистентности (DRY)
    const { year, month } = Utils.SlugUtils ? Utils.SlugUtils.parseDate(newsItem.date) : this._parseDateFallback(newsItem.date);
    const slug = this._generateSlug(title);

    // Используем hash-based роутинг для работы на статических серверах (LiveServer, nginx без SPA config)
    const url = `#/news/${year}/${month}/${slug}`;
    
    // Добавляем запись в историю браузера
    history.pushState(
      { type: 'news', newsId: id },
      newsItem.title,
      window.location.pathname + url
    );

    this.currentNewsId = id;
    
    Logger.INFO(`Открыта новость: ${url}`);
  }

  /**
   * Открытие новости из состояния истории
   * @param {number|string} id - ID новости
   */
  _openNewsFromState(id) {
    if (this.newsManager) {
      this.currentNewsId = id;
      this.newsManager.openNewsModal(id, false);
      Logger.INFO(`Восстановлено состояние новости: ${id}`);
    }
  }

  /**
   * Закрытие модального окна новости
   */
  _closeNewsModal() {
    if (this.newsManager) {
      this.newsManager.closeNewsModal();
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
      // Очищаем состояние истории, возвращаясь к базовому URL без hash
      history.replaceState({}, '', window.location.pathname);
      this.currentNewsId = null;
      Logger.INFO('URL восстановлен к базовому пути');
    }
  }
}

// Экспортируем класс глобально
window.NewsNavigation = NewsNavigation;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NewsNavigation };
}
