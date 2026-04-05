/**
 * Рендеринг новостей
 * ООО "Волга-Днепр Инжиниринг"
 */

class NewsRenderer {
  constructor(newsData) {
    this.newsData = newsData;
    this.loadedYears = new Set();
  }

  render(year, container, options = {}) {
    if (!container) return;
    if (this.loadedYears.has(year)) return;
    
    this.loadedYears.add(year);
    const newsList = this.newsData[year] || [];
    
    if (newsList.length === 0) {
      container.innerHTML = '<p class="no-news">Нет новостей за выбранный период</p>';
      return;
    }

    const DEFAULT_VISIBLE = 2;
    const fragment = document.createDocumentFragment();
    
    newsList.forEach((news, index) => {
      const card = this._createNewsCard(news, index);
      if (index >= DEFAULT_VISIBLE) {
        DOMHelper.addClass(card, 'hidden-news');
      }
      fragment.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    if (newsList.length > DEFAULT_VISIBLE) {
      this._addAccordionButton(container, newsList.length, DEFAULT_VISIBLE);
    }
    
    this._lazyLoadImages(container);
    this._animateCards(container);
  }

  _createNewsCard(news, index) {
    const article = document.createElement('article');
    DOMHelper.addClass(article, 'news-card');
    article.style.animationDelay = `${index * 50}ms`;
    
    const imageHtml = this._createImageHtml(news);
    const contentHtml = this._createContentHtml(news);
    
    article.innerHTML = imageHtml + contentHtml;
    return article;
  }

  _createImageHtml(news) {
    return `
      <div class="news-card-image">
        <div class="image-placeholder"></div>
        <img data-src="${this._escapeHtml(news.image)}" alt="${this._escapeHtml(news.title)}" loading="lazy">
        <span class="news-card-category">${this._escapeHtml(news.category)}</span>
      </div>
    `;
  }

  _createContentHtml(news) {
    return `
      <div class="news-card-content">
        <div class="news-card-date">
          <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          ${this._escapeHtml(news.date)}
        </div>
        <h3 class="news-card-title">${this._escapeHtml(news.title)}</h3>
        <p class="news-card-excerpt">${this._escapeHtml(news.excerpt)}</p>
        <button class="news-card-link" data-news-id="${news.id}">
          Подробнее
          <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </button>
      </div>
    `;
  }

  _addAccordionButton(container, totalNews, defaultVisible) {
    const existing = DOMHelper.query('.news-accordion-container', container);
    if (existing) existing.remove();
    
    const wrapper = document.createElement('div');
    DOMHelper.addClass(wrapper, 'news-accordion-container');
    
    const button = document.createElement('button');
    DOMHelper.addClass(button, 'news-accordion-btn');
    button.innerHTML = `
      Показать все (${totalNews - defaultVisible})
      <svg class="accordion-icon" viewBox="0 0 24 24">
        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
      </svg>
    `;
    
    let expanded = false;
    button.addEventListener('click', () => {
      const hiddenNews = DOMHelper.queryAll('.news-card.hidden-news', container);
      
      if (!expanded) {
        hiddenNews.forEach(card => DOMHelper.removeClass(card, 'hidden-news'));
        button.innerHTML = `
          Свернуть
          <svg class="accordion-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        `;
        DOMHelper.addClass(button, 'expanded');
        expanded = true;
      } else {
        DOMHelper.queryAll('.news-card', container).forEach((card, idx) => {
          if (idx >= defaultVisible) {
            DOMHelper.addClass(card, 'hidden-news');
          }
        });
        button.innerHTML = `
          Показать все (${totalNews - defaultVisible})
          <svg class="accordion-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        `;
        DOMHelper.removeClass(button, 'expanded');
        expanded = false;
      }
    });
    
    wrapper.appendChild(button);
    container.appendChild(wrapper);
  }

  _lazyLoadImages(container) {
    const images = DOMHelper.queryAll('.news-card-image img', container);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.onload = () => {
              DOMHelper.addClass(img, 'loaded');
              const placeholder = img.parentElement?.querySelector('.image-placeholder');
              if (placeholder) placeholder.style.display = 'none';
            };
          }
          observer.unobserve(img);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    images.forEach(img => observer.observe(img));
  }

  _animateCards(container) {
    DOMHelper.queryAll('.news-card', container).forEach((card, index) => {
      setTimeout(() => {
        DOMHelper.addClass(card, 'loaded');
      }, index * 50);
    });
  }

  _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewsRenderer;
}