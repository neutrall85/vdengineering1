/**
 * CookieBanner - простой баннер cookie-согласия
 * KISS: один файл, одна ответственность
 */
(function() {
  'use strict';
  
  const STORAGE_KEY = 'cookie_consent';
  
  // Шаблон
  const template = `
    <div id="cookie-banner" class="cookie-banner">
      <div class="cookie-banner-content">
        <h3 class="cookie-banner-title">Мы используем файлы cookie</h3>
        <p class="cookie-banner-text">
          Этот сайт использует файлы cookie для улучшения работы.
        </p>
        <div class="cookie-banner-buttons">
          <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">
            Принять
          </button>
          <button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject">
            Отклонить
          </button>
        </div>
        <a href="#" data-policy="privacy" class="cookie-privacy-link">Политика конфиденциальности</a>
      </div>
    </div>
  `;
  
  function init() {
    // Проверяем согласие
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        return;
      }
    } catch (e) {
      return;
    }
    
    // Ждем готовности body
    if (!document.body) {
      setTimeout(init, 50);
      return;
    }
    
    // Не дублируем
    if (document.getElementById('cookie-banner')) {
      return;
    }
    
    // Вставляем баннер
    document.body.insertAdjacentHTML('beforeend', template);
    
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    
    banner.style.display = 'flex';
    
    // Один обработчик через делегирование
    banner.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-cookie-action]');
      if (!btn) return;
      
      const action = btn.getAttribute('data-cookie-action');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          value: action,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {}
      
      banner.style.display = 'none';
    });
  }
  
  // Автозапуск при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
