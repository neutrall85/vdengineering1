/**
 * Управление новостями
 * ООО "Волга-Днепр Инжиниринг"
 */

class NewsManager {
  constructor(newsData, renderer) {
    this.newsData = newsData;
    this.renderer = renderer;
    this.activeYear = null;
  }

  init() {
    console.log('NewsManager initializing...');
    this._initTabs();
    this._initModal();
    this._initCardClickHandler();
  }

  _initTabs() {
    const tabs = document.querySelectorAll('.news-tab');
    
    if (tabs.length === 0) {
      console.log('No news tabs found');
      return;
    }
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const year = tab.dataset.year;
        if (!year) return;
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.news-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`tab-${year}`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        
        this.activeYear = year;
        const container = document.getElementById(`newsGrid-${year}`);
        if (container && this.renderer) {
          this.renderer.render(year, container);
        }
      });
    });
    
    // Активируем первый таб и загружаем новости
    const activeTab = document.querySelector('.news-tab.active');
    if (activeTab?.dataset.year) {
      setTimeout(() => {
        const year = activeTab.dataset.year;
        const container = document.getElementById(`newsGrid-${year}`);
        if (container && this.renderer) {
          this.renderer.render(year, container);
        }
        this.activeYear = year;
      }, 100);
    } else if (tabs[0]) {
      // Если нет активного таба, активируем первый
      tabs[0].classList.add('active');
      const year = tabs[0].dataset.year;
      const container = document.getElementById(`newsGrid-${year}`);
      if (container && this.renderer) {
        this.renderer.render(year, container);
      }
      this.activeYear = year;
    }
  }

  _initModal() {
    // Модальное окно уже зарегистрировано в app.js
    console.log('News modal ready');
  }

  _initCardClickHandler() {
    // Обработка кликов по ссылкам новостей (теперь это <a> элементы)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.news-card-link');
      if (link) {
        const newsId = parseInt(link.dataset.newsId, 10);
        if (newsId) {
          e.preventDefault(); // Предотвращаем переход по ссылке
          this.openNewsModal(newsId);
          // Обновляем URL с новым форматом для возможности шеринга
          const allNews = Object.values(this.newsData).flat();
          const news = allNews.find(n => n.id === newsId);
          if (news && window.SlugUtils) {
            const newsLink = window.SlugUtils.generateNewsLink(news);
            history.pushState(null, '', newsLink);
          }
        }
      }
    });
    
    // Проверка URL при загрузке страницы для открытия конкретной новости
    this._checkUrlOnLoad();
    
    // Отслеживание изменений пути (для SPA навигации)
    window.addEventListener('popstate', () => {
      this._checkUrlOnLoad();
    });
  }

  _checkUrlOnLoad() {
    // Получаем путь после news.html
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Проверяем формат: /YYYY/MM/DD/slug
    const match = path.match(/\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)$/);
    
    if (match) {
      const [, year, month, day, slug] = match;
      this._findAndOpenNews(year, month, day, slug);
      return;
    }
    
    // Обратная совместимость со старым форматом #slug-id
    if (hash && hash.length > 1) {
      const hashValue = hash.substring(1);
      const lastDashIndex = hashValue.lastIndexOf('-');
      
      if (lastDashIndex !== -1) {
        const idStr = hashValue.substring(lastDashIndex + 1);
        const newsId = parseInt(idStr, 10);
        
        if (!isNaN(newsId)) {
          const allNews = Object.values(this.newsData).flat();
          const news = allNews.find(n => n.id === newsId);
          if (news) {
            setTimeout(() => {
              this.openNewsModal(newsId);
            }, 100);
          }
        }
      }
    }
  }

  _findAndOpenNews(year, month, day, slug) {
    const allNews = Object.values(this.newsData).flat();
    
    // Ищем новость по дате и slug
    const news = allNews.find(n => {
      const parsedDate = window.SlugUtils ? window.SlugUtils.parseDate(n.date) : null;
      if (!parsedDate) return false;
      
      // Сравниваем год и месяц (день всегда 01 в нашем формате)
      const dateMatch = parsedDate.year === year && parsedDate.month === month;
      
      // Генерируем slug из заголовка и сравниваем
      const newsSlug = window.SlugUtils ? window.SlugUtils.createShortSlug(n.title) : '';
      const slugMatch = newsSlug === slug;
      
      return dateMatch && slugMatch;
    });
    
    if (news) {
      // Небольшая задержка чтобы убедиться что контент загружен
      setTimeout(() => {
        this.openNewsModal(news.id);
      }, 100);
    } else {
      console.log('News not found for:', { year, month, day, slug });
    }
  }

  openNewsModal(id) {
    const allNews = Object.values(this.newsData).flat();
    const news = allNews.find(n => n.id === id);
    
    if (!news) return;
    
    this._populateModal(news);
    
    const manager = (typeof modalManager !== 'undefined') ? modalManager : (window.UI?.modalManager);
    if (manager) {
      manager.open('news');
    } else {
      console.warn('ModalManager not available');
    }
  }

  _populateModal(news) {
    const title = document.getElementById('newsModalTitle');
    const date = document.getElementById('newsModalDate');
    const category = document.getElementById('newsModalCategory');
    const image = document.getElementById('newsModalImage');
    const content = document.getElementById('newsModalContent');
    
    // Используем санитизацию для безопасности
    const sanitizer = window.Utils?.Sanitizer;
    
    if (title) title.textContent = sanitizer ? sanitizer.escapeHtml(news.title) : news.title;
    if (date) date.textContent = sanitizer ? sanitizer.escapeHtml(news.date) : news.date;
    if (category) category.textContent = sanitizer ? sanitizer.escapeHtml(news.category) : news.category;
    if (image) {
      const imageUrl = sanitizer ? (sanitizer.isValidUrl(news.image) ? news.image : 'assets/images/placeholder.jpg') : news.image;
      image.src = imageUrl;
      image.alt = sanitizer ? sanitizer.escapeHtml(news.title) : news.title;
    }
    if (content) {
      // Санитизируем HTML контент
      const safeContent = sanitizer ? sanitizer.sanitizeHtml(news.content, {
        allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'span', 'div']
      }) : news.content;
      content.innerHTML = safeContent;
    }
  }

  _resetModalContent() {
    const image = document.getElementById('newsModalImage');
    if (image) image.src = '';
  }
}

window.NewsManager = NewsManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewsManager;
}