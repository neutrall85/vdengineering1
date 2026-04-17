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
    Logger.INFO('NewsManager initializing...');
    this._initTabs();
    this._initModal();
    this._initCardClickHandler();
  }

  _initTabs() {
    const tabs = document.querySelectorAll('.news-tab');
    
    if (tabs.length === 0) {
      Logger.INFO('No news tabs found');
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
    Logger.INFO('News modal ready');
  }

  _initCardClickHandler() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.news-card-link');
      if (link) {
        const newsId = parseInt(link.dataset.newsId, 10);
        if (newsId) {
          e.preventDefault();
          this.openNewsModal(newsId);
        }
      }
    });
    
    // Инициализация навигации через NewsNavigation (DRY)
    if (window.NewsNavigation) {
      window.NewsNavigation.init(this);
    }
  }

  openNewsModal(id, updateUrl = true) {
    const allNews = Object.values(this.newsData).flat();
    const news = allNews.find(n => n.id === id);
    
    if (!news) return;
    
    this._populateModal(news);
    
    const manager = (typeof modalManager !== 'undefined') ? modalManager : (window.UI?.modalManager);
    if (manager) {
      manager.open('news');
      
      // Обновляем URL только если нужно и есть NewsNavigation
      if (updateUrl && window.NewsNavigation) {
        window.NewsNavigation.openNewsUrl(id, news.title);
      }
    } else {
      Logger.WARN('ModalManager not available');
    }
  }

  closeNewsModal() {
    const manager = (typeof modalManager !== 'undefined') ? modalManager : (window.UI?.modalManager);
    if (manager) {
      manager.close('news');
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

export { NewsManager };
window.NewsManager = NewsManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewsManager;
}