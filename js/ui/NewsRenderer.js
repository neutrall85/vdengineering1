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

  renderPreview(container, count = 3) {
    if (!container) return;

    // Функция для парсинга даты из строки вида "Месяц YYYY"
    const parseDate = (dateStr) => {
      const months = {
        'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3, 'май': 4, 'июнь': 5,
        'июль': 6, 'август': 7, 'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11
      };
      const parts = dateStr.toLowerCase().split(' ');
      const month = months[parts[0]];
      const year = parseInt(parts[1], 10);
      if (isNaN(year) || month === undefined) return new Date(0);
      return new Date(year, month);
    };

    const allNews = Object.values(this.newsData).flat();
    const latestNews = allNews.sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, count);

    if (latestNews.length === 0) {
      const noNews = document.createElement('p');
      noNews.classList.add('no-news');
      noNews.textContent = 'Нет новостей';
      container.appendChild(noNews);
      return;
    }

    container.replaceChildren();
    const fragment = document.createDocumentFragment();
    
    latestNews.forEach((news, index) => {
      const card = this._createNewsCard(news, index);
      fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
    this._lazyLoadImages(container);
    this._animateCards(container);
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
    // Атрибут loading="lazy" удалён – ленивая загрузка реализована через IntersectionObserver
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
    // Возвращаем заглушку для совместимости
    return '#';
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
            // Создаем обработчики через addEventListener вместо on* свойств
            const onLoadHandler = () => {
              img.classList.add('loaded');
              const placeholder = img.parentElement?.querySelector('.image-placeholder');
              if (placeholder) placeholder.style.display = 'none';
              img.removeEventListener('load', onLoadHandler);
              img.removeEventListener('error', onErrorHandler);
            };
            
            const onErrorHandler = () => {
              Logger.WARN('Failed to load image:', src);
              img.src = 'assets/images/placeholder.jpg';
              img.classList.add('loaded');
              img.removeEventListener('load', onLoadHandler);
              img.removeEventListener('error', onErrorHandler);
            };
            
            img.addEventListener('load', onLoadHandler);
            img.addEventListener('error', onErrorHandler);
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { threshold: 0.1, rootMargin: '100px' });
    
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

// Экспорт удален - регистрация происходит через Application.services