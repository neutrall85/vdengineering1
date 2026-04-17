/**
 * Инициализация специфичных обработчиков для главной страницы
 * ООО "Волга-Днепр Инжиниринг"
 */

document.addEventListener('DOMContentLoaded', function() {
  // Инициализация обработчиков для кнопок с ID вместо onclick
  const quoteButtons = ['heroRequestQuoteBtn', 'aboutRequestQuoteBtn', 'servicesRequestQuoteBtn'];
  
  quoteButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', function() {
        if (window.openModal && typeof window.openModal === 'function') {
          window.openModal();
        }
      });
    }
  });
  
  const contactEmailLink = document.getElementById('contactEmailLink');
  if (contactEmailLink) {
    contactEmailLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Открыть почтовый клиент?')) {
        window.location.href = this.getAttribute('href');
      }
    });
  }
  
  // Обработчики для кнопок закрытия модальных окон удалены - теперь используется единый обработчик в ModalManager.js (DRY, KISS)
  
  const floatingCtaBtn = document.getElementById('floatingCtaBtn');
  if (floatingCtaBtn) {
    floatingCtaBtn.addEventListener('click', function() {
      if (window.openModal && typeof window.openModal === 'function') {
        window.openModal();
      }
    });
  }
  
  const scrollToTopBtn = document.getElementById('scrollToTop');
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function() {
      if (window.scrollToTop && typeof window.scrollToTop === 'function') {
        window.scrollToTop();
      }
    });
  }
  
  const originalFormContainer = document.getElementById('commercial-offer');
  const modalBodyContainer = document.getElementById('modalBodyContainer');
  
  if (originalFormContainer && modalBodyContainer) {

    const formClone = originalFormContainer.cloneNode(true);
    
    formClone.removeAttribute('id');
    modalBodyContainer.innerHTML = '';
    modalBodyContainer.appendChild(formClone);
    
    const cloneElements = modalBodyContainer.querySelectorAll('[id]');
    
    cloneElements.forEach(el => {
      // Оставляем id только для важных элементов формы
      if (el.id && (el.id === 'proposalForm' || el.id === 'submitBtn' || 
          el.id === 'fileAttachment' || el.id === 'fileDrop' || el.id === 'fileList' ||
          el.id === 'phone')) {
        // Для поля телефона добавляем уникальный класс чтобы можно было найти его в модалке
        if (el.id === 'phone') {
          el.classList.add('modal-phone-input');
        }
        // Для зоны загрузки файлов добавляем класс чтобы можно было найти её в модалке
        if (el.id === 'fileDrop') {
          el.classList.add('modal-file-drop');
        }
      } else if (el.id) {
        el.removeAttribute('id');
      }
    });
    
    const rateLimitWarning = modalBodyContainer.querySelector('.rate-limit-warning');
    if (rateLimitWarning) rateLimitWarning.classList.remove('show');
    
    const successMessage = modalBodyContainer.querySelector('.success-message');
    if (successMessage) successMessage.classList.remove('show');
  }
  
  // Автоподстановка +7 для поля телефона
  function setupPhoneAutoPrefix(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('blur', function() {
      this.value = Utils.PhoneUtils.addPrefix(this.value);
    });
  }
  
  // Применяем к основному полю на странице
  const mainPhoneInput = document.getElementById('phone');
  if (mainPhoneInput) {
    setupPhoneAutoPrefix(mainPhoneInput);
  }
  
  // Функция для применения автоподстановки к полям в модалке
  function applyPhoneAutoPrefixToModal() {
    const modalPhoneInput = document.querySelector('#modalOverlay #phone');
    if (modalPhoneInput) {
      setupPhoneAutoPrefix(modalPhoneInput);
    }
  }
  
  // Вызываем при открытии модалки (если она уже есть в DOM)
  applyPhoneAutoPrefixToModal();
  
  // Инициализация карточек новостей на главной странице
  const previewGrid = document.getElementById('previewNewsGrid');
  if (previewGrid && typeof NEWS_DATA !== 'undefined') {
    // Собираем все новости и сортируем по ID (новые сверху)
    const allNews = [];
    for (const year in NEWS_DATA) {
      allNews.push(...NEWS_DATA[year]);
    }
    const latestNews = allNews.sort((a, b) => b.id - a.id).slice(0, 3);

    // Очищаем контейнер
    previewGrid.innerHTML = '';

    // Создаём карточки через DOM API (безопасно, без innerHTML)
    latestNews.forEach(news => {
      const article = document.createElement('article');
      article.className = 'news-card';

      // Блок изображения
      const imageDiv = document.createElement('div');
      imageDiv.className = 'news-card-image';

      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';

      const img = document.createElement('img');
      img.setAttribute('data-src', Utils.Sanitizer.escapeHtml(news.image) || 'assets/images/placeholder.jpg');
      img.setAttribute('alt', Utils.Sanitizer.escapeHtml(news.title));
      img.setAttribute('loading', 'lazy');
      img.onerror = function() { this.src = 'assets/images/placeholder.jpg'; };

      const categorySpan = document.createElement('span');
      categorySpan.className = 'news-card-category';
      categorySpan.textContent = Utils.Sanitizer.escapeHtml(news.category);

      imageDiv.appendChild(placeholder);
      imageDiv.appendChild(img);
      imageDiv.appendChild(categorySpan);

      // Блок контента
      const contentDiv = document.createElement('div');
      contentDiv.className = 'news-card-content';

      // Дата с иконкой
      const dateDiv = document.createElement('div');
      dateDiv.className = 'news-card-date';

      const dateSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      dateSvg.setAttribute('viewBox', '0 0 24 24');
      const datePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      datePath.setAttribute('d', 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z');
      dateSvg.appendChild(datePath);
      dateDiv.appendChild(dateSvg);
      dateDiv.appendChild(document.createTextNode(' ' + Utils.Sanitizer.escapeHtml(news.date)));

      const title = document.createElement('h3');
      title.className = 'news-card-title';
      title.textContent = Utils.Sanitizer.escapeHtml(news.title);

      const excerpt = document.createElement('p');
      excerpt.className = 'news-card-excerpt';
      excerpt.textContent = Utils.Sanitizer.escapeHtml(news.excerpt);

      const link = document.createElement('a');
      link.className = 'news-card-link';
      link.setAttribute('data-news-id', news.id);
      link.setAttribute('href', '#');
      link.textContent = 'Подробнее';

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

      article.appendChild(imageDiv);
      article.appendChild(contentDiv);
      previewGrid.appendChild(article);
    });

    // Делегирование событий: открытие модалки по клику на ссылку "Подробнее"
    previewGrid.addEventListener('click', (e) => {
      const link = e.target.closest('.news-card-link');
      if (link && link.dataset.newsId) {
        e.preventDefault();
        if (window.newsManager && typeof window.newsManager.openNewsModal === 'function') {
          window.newsManager.openNewsModal(parseInt(link.dataset.newsId, 10));
        }
      }
    });
  }
});
