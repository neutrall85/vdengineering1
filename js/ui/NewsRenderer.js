/**
 * Рендеринг новостей
 * ООО "Волга-Днепр Инжиниринг"
 */

class NewsRenderer {
  constructor(newsData) {
    this.newsData = newsData;
    this.loadedYears = new Set();
    this.cardStaggerMs = window.CONFIG?.ANIMATION?.CARD_STAGGER_MS || 50;
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
    article.style.animationDelay = `${index * this.cardStaggerMs}ms`;
    
    const imageHtml = this._createImageHtml(news);
    const contentHtml = this._createContentHtml(news);
    
    article.innerHTML = imageHtml + contentHtml;
    return article;
  }

  _createImageHtml(news) {
    // Используем data-src для lazy loading
    return `
      <div class="news-card-image">
        <div class="image-placeholder"></div>
        <img data-src="${this._escapeHtml(news.image)}" 
             alt="${this._escapeHtml(news.title)}" 
             loading="lazy"
             onerror="this.src='assets/images/placeholder.jpg'">
        <span class="news-card-category">${this._escapeHtml(news.category)}</span>
      </div>
    `;
  }

  _createContentHtml(news) {
    // Генерируем ссылку в формате: /2023/10/01/korotkoe-nazvanie-id
    const { year, month } = window.SlugUtils ? window.SlugUtils.parseDate(news.date) : { year: '2023', month: '01' };
    const day = '01';
    const shortSlug = window.SlugUtils ? window.SlugUtils.createShortSlug(news.title) : this._escapeHtml(news.title).toLowerCase().replace(/\s+/g, '-');
    const newsLink = `/${year}/${month}/${day}/${shortSlug}-${news.id}`;
    
    return `
      <div class="news-card-content">
        <div class="news-card-date">
          <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          ${this._escapeHtml(news.date)}
        </div>
        <h3 class="news-card-title">${this._escapeHtml(news.title)}</h3>
        <p class="news-card-excerpt">${this._escapeHtml(news.excerpt)}</p>
        <a href="${newsLink}" class="news-card-link" data-news-id="${news.id}">
          Подробнее
          <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
        </a>
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
    let isAnimating = false;
    
    button.addEventListener('click', () => {
      if (isAnimating) return;
      isAnimating = true;
      
      const hiddenNews = container.querySelectorAll('.news-card.hidden-news');
      
      if (!expanded) {
        // Плавное появление скрытых новостей
        hiddenNews.forEach((card, idx) => {
          setTimeout(() => {
            card.classList.remove('hidden-news');
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
              card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 50);
          }, idx * 50);
        });
        
        button.innerHTML = `
          Свернуть
          <svg class="accordion-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        `;
        button.classList.add('expanded');
        expanded = true;
      } else {
        // Плавное скрытие
        const cards = container.querySelectorAll('.news-card');
        cards.forEach((card, idx) => {
          if (idx >= defaultVisible) {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
              card.classList.add('hidden-news');
              card.style.opacity = '';
              card.style.transform = '';
            }, 300);
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
      
      setTimeout(() => {
        isAnimating = false;
      }, 350);
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
            img.onerror = () => {
              console.warn('Failed to load image:', src);
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

  _animateCards(container) {
    const cards = container.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('loaded');
      }, index * this.cardStaggerMs);
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

window.NewsRenderer = NewsRenderer;