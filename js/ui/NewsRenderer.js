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
      // Используем общий рендерер для создания карточки
      const card = window.NewsCardRenderer.createCard(news);
      card.style.animationDelay = `${index * this.cardStaggerMs}ms`;
      
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