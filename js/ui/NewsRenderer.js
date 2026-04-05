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
    if (!container) {
      console.warn('Container not found for year:', year);
      return;
    }
    
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
        card.classList.add('hidden-news');
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
    article.classList.add('news-card');
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
    const existing = container.querySelector('.news-accordion-container');
    if (existing) existing.remove();
    
    const wrapper = document.createElement('div');
    wrapper.classList.add('news-accordion-container');
    
    const button = document.createElement('button');
    button.classList.add('news-accordion-btn');
    button.innerHTML = `
      Показать все (${totalNews - defaultVisible})
      <svg class="accordion-icon" viewBox="0 0 24 24">
        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
      </svg>
    `;
    
    let expanded = false;
    button.addEventListener('click', () => {
      const hiddenNews = container.querySelectorAll('.news-card.hidden-news');
      
      if (!expanded) {
        hiddenNews.forEach(card => card.classList.remove('hidden-news'));
        button.innerHTML = `
          Свернуть
          <svg class="accordion-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        `;
        button.classList.add('expanded');
        expanded = true;
      } else {
        const cards = container.querySelectorAll('.news-card');
        cards.forEach((card, idx) => {
          if (idx >= defaultVisible) {
            card.classList.add('hidden-news');
          }
        });
        button.innerHTML = `
          Показать все (${totalNews - defaultVisible})
          <svg class="accordion-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        `;
        button.classList.remove('expanded');
        expanded = false;
      }
    });
    
    wrapper.appendChild(button);
    container.appendChild(wrapper);
  }

  _lazyLoadImages(container) {
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
          }
          observer.unobserve(img);
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    images.forEach(img => observer.observe(img));
  }

  _animateCards(container) {
    const cards = container.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('loaded');
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