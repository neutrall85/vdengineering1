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
  
  const previewGrid = document.getElementById('previewNewsGrid');
  if (previewGrid && typeof NEWS_DATA !== 'undefined') {
    const allNews = [];
    for (const year in NEWS_DATA) {
      allNews.push(...NEWS_DATA[year]);
    }
    const latestNews = allNews.sort((a, b) => b.id - a.id).slice(0, 3);

    previewGrid.innerHTML = latestNews.map(news => `
      <div class="news-card-preview" data-news-id="${news.id}">
        <div class="news-card-preview-image">
          <img src="${Utils.Sanitizer.escapeHtml(news.image)}" alt="${Utils.Sanitizer.escapeHtml(news.title)}">
        </div>
        <div class="news-card-preview-content">
          <span class="news-card-preview-category">${Utils.Sanitizer.escapeHtml(news.category)}</span>
          <h3>${Utils.Sanitizer.escapeHtml(news.title)}</h3>
          <p>${Utils.Sanitizer.escapeHtml(news.excerpt)}</p>
          <button class="news-card-preview-link" data-news-id="${news.id}">Подробнее →</button>
        </div>
      </div>
    `).join('');
    
    // Добавляем обработчики кликов на карточки новостей
    setTimeout(() => {
      previewGrid.querySelectorAll('.news-card-preview').forEach(card => {
        card.addEventListener('click', function(e) {
          if (!e.target.closest('button')) {
            const newsId = this.getAttribute('data-news-id');
            if (window.newsManager && typeof window.newsManager.openNewsModal === 'function') {
              window.newsManager.openNewsModal(parseInt(newsId, 10));
            }
          }
        });
      });
    }, 50);
  }
});
