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
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.news-card-link');
      if (button) {
        const newsId = parseInt(button.dataset.newsId, 10);
        if (newsId) {
          this.openNewsModal(newsId);
        }
      }
    });
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
    
    if (title) title.textContent = news.title;
    if (date) date.textContent = news.date;
    if (category) category.textContent = news.category;
    if (image) {
      image.src = news.image;
      image.alt = news.title;
    }
    if (content) content.innerHTML = news.content;
  }

  _resetModalContent() {
    const image = document.getElementById('newsModalImage');
    if (image) image.src = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewsManager;
}