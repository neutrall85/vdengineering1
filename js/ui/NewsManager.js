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
    this._initTabs();
    this._initModal();
    this._initCardClickHandler();
  }

  _initTabs() {
    const tabs = DOMHelper.queryAll('.news-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const year = tab.dataset.year;
        if (!year) return;
        
        tabs.forEach(t => DOMHelper.removeClass(t, 'active'));
        DOMHelper.addClass(tab, 'active');
        
        DOMHelper.queryAll('.news-tab-content').forEach(content => {
          DOMHelper.removeClass(content, 'active');
        });
        
        const activeContent = DOMHelper.getElement(`tab-${year}`);
        if (activeContent) {
          DOMHelper.addClass(activeContent, 'active');
        }
        
        this.activeYear = year;
        const container = DOMHelper.getElement(`newsGrid-${year}`);
        if (container) {
          this.renderer.render(year, container);
        }
      });
    });
    
    const activeTab = DOMHelper.query('.news-tab.active');
    if (activeTab?.dataset.year) {
      setTimeout(() => {
        const year = activeTab.dataset.year;
        const container = DOMHelper.getElement(`newsGrid-${year}`);
        if (container) {
          this.renderer.render(year, container);
        }
        this.activeYear = year;
      }, 100);
    }
  }

  _initModal() {
    modalManager.register('news', {
      overlayId: 'newsModalOverlay',
      onClose: () => {
        this._resetModalContent();
      }
    });
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
    modalManager.open('news');
  }

  _populateModal(news) {
    const title = DOMHelper.getElement('newsModalTitle');
    const date = DOMHelper.getElement('newsModalDate');
    const category = DOMHelper.getElement('newsModalCategory');
    const image = DOMHelper.getElement('newsModalImage');
    const content = DOMHelper.getElement('newsModalContent');
    
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
    const image = DOMHelper.getElement('newsModalImage');
    if (image) image.src = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewsManager;
}