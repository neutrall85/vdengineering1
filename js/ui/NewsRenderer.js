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
      Logger.WARN('Container not found for year:', year);
      return;
    }
    
    if (this.loadedYears.has(year)) return;
    
    this.loadedYears.add(year);
    const newsList = this.newsData[year] || [];
    
    if (newsList.length === 0) {
      const noNews = document.createElement('p');
      noNews.classList.add('no-news');
      noNews.textContent = 'Нет новостей за выбранный период';
      container.appendChild(noNews);
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
    
    container.replaceChildren(fragment);
    
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
    
    // Создаем элементы через DOM API вместо innerHTML для безопасности
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('news-card-image');
    
    const placeholder = document.createElement('div');
    placeholder.classList.add('image-placeholder');
    
    const img = document.createElement('img');
    img.setAttribute('data-src', Utils.Sanitizer.escapeHtml(news.image));
    img.setAttribute('alt', Utils.Sanitizer.escapeHtml(news.title));
    img.setAttribute('loading', 'lazy');
    img.addEventListener('error', function() { this.src = 'assets/images/placeholder.jpg'; });
    
    const category = document.createElement('span');
    category.classList.add('news-card-category');
    category.textContent = Utils.Sanitizer.escapeHtml(news.category);
    
    imageContainer.appendChild(placeholder);
    imageContainer.appendChild(img);
    imageContainer.appendChild(category);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('news-card-content');
    
    const dateDiv = document.createElement('div');
    dateDiv.classList.add('news-card-date');
    
    // Добавляем SVG иконку через DOM API
    const dateSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dateSvg.setAttribute('viewBox', '0 0 24 24');
    const datePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    datePath.setAttribute('d', 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z');
    dateSvg.appendChild(datePath);
    dateDiv.appendChild(dateSvg);
    
    const dateText = document.createTextNode(` ${this._escapeHtml(news.date)}`);
    dateDiv.appendChild(dateText);
    
    const title = document.createElement('h3');
    title.classList.add('news-card-title');
    title.textContent = Utils.Sanitizer.escapeHtml(news.title);
    
    const excerpt = document.createElement('p');
    excerpt.classList.add('news-card-excerpt');
    excerpt.textContent = Utils.Sanitizer.escapeHtml(news.excerpt);
    
    const link = document.createElement('a');
    link.classList.add('news-card-link');
    link.setAttribute('href', this._createNewsLink(news));
    link.setAttribute('data-news-id', news.id);
    link.textContent = 'Подробнее';
    
    // Добавляем SVG иконку через DOM API
    const linkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    linkSvg.setAttribute('viewBox', '0 0 24 24');
    const linkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linkPath.setAttribute('d', 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z');
    linkSvg.appendChild(linkPath);
    link.appendChild(linkSvg);
    
    contentDiv.appendChild(dateDiv);
    contentDiv.appendChild(title);
    contentDiv.appendChild(excerpt);
    contentDiv.appendChild(link);
    
    article.appendChild(imageContainer);
    article.appendChild(contentDiv);
    
    return article;
  }

  _createNewsLink(news) {
    // Используем централизованную утилиту Utils.SlugUtils для соблюдения DRY
    const { year, month } = Utils.SlugUtils ? Utils.SlugUtils.parseDate(news.date) : this._parseDateFallback(news.date);
    const slug = Utils.SlugUtils ? Utils.SlugUtils.createShortSlug(news.title) : this._fallbackGenerateSlug(news.title);
    // Используем hash-based роутинг для работы на статических серверах (LiveServer)
    return `#/news/${year}/${month}/${slug}`;
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

  _addAccordionButton(container, totalNews, defaultVisible) {
    const existing = container.querySelector('.news-accordion-container');
    if (existing) existing.remove();
    
    const wrapper = document.createElement('div');
    wrapper.classList.add('news-accordion-container');
    
    const button = document.createElement('button');
    button.classList.add('news-accordion-btn');
    
    // Создаем содержимое кнопки через DOM API
    const buttonText = document.createTextNode(`Показать ещё (${totalNews - defaultVisible})`);
    button.appendChild(buttonText);
    
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.classList.add('accordion-icon');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z');
    svgIcon.appendChild(svgPath);
    button.appendChild(svgIcon);
    
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
        
        // Обновляем текст кнопки
        button.firstChild.textContent = `Свернуть`;
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
        
        // Обновляем текст кнопки
        button.firstChild.textContent = `Показать ещё (${totalNews - defaultVisible})`;
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
              Logger.WARN('Failed to load image:', src);
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