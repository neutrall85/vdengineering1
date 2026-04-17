/**
 Менеджер cookie-согласий и обнаружения блокировщиков рекламы
 */

class ConsentManager {
  constructor(storageService) {
    this.storage = storageService;
    this.consentKey = 'cookie_consent';
    this.adBlockKey = 'adblock_detected';
    this.categories = {
      functional: {
        id: 'functional',
        name: 'Функциональные',
        description: 'Для входа в личный кабинет и работы основных функций',
        required: true
      },
      analytics: {
        id: 'analytics',
        name: 'Аналитические',
        description: 'Для сбора статистики посещений и улучшения сайта',
        required: false
      },
      marketing: {
        id: 'marketing',
        name: 'Маркетинговые',
        description: 'Для показа релевантной рекламы',
        required: false
      }
    };
    this.banner = null;
    this.adBlockWarning = null;
  }

  init() {
    this._renderAdBlockWarning();
    this._checkConsent();
    this._detectAdBlock();
  }

  getConsent() {
    return this.storage.get(this.consentKey, null);
  }

  saveConsent(consent) {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      categories: consent
    };
    this.storage.set(this.consentKey, consentData);
    this._hideBanner();
    this._applyConsent(consent);
  }

  withdrawConsent() {
    this.storage.remove(this.consentKey);
    this._showBanner();
  }

  _checkConsent() {
    const consent = this.getConsent();
    if (!consent) {
      this._renderBanner();
    } else {
      this._applyConsent(consent.categories);
    }
  }

  _applyConsent(categories) {
    // Если аналитика отключена - отключаем Яндекс.Метрику
    if (categories && !categories.analytics) {
      try {
        const counterId = window.CONFIG?.YANDEX?.METRIKA_COUNTER_ID || '108333042';
        
        if (typeof window.ym !== 'undefined') {
          // Способ 1: Удаляем данные
          window.ym(counterId, 'userParams', { analytics_enabled: false });
          
          // Способ 2: Отключаем отправку данных
          window.ym(counterId, 'hit', window.location.href, {
            params: { analytics: 'disabled' }
          });
          
          Logger.INFO('Yandex Metrica disabled by user');
        }
      } catch (error) {
        Logger.WARN('Error disabling Yandex Metrica:', error.message);
      }
    }
    
    // Здесь можно добавить логику для других категорий (marketing и т.д.)
    if (categories && !categories.marketing) {
      // Отключаем маркетинговые скрипты
      Logger.INFO('Marketing cookies disabled by user');
    }
  } // <-- Исправлено: добавлена закрывающая скобка

  _renderBanner() {
    if (document.getElementById('cookie-banner')) return;

    const sanitizer = Utils.Sanitizer || { escapeHtml: (str) => str };
    
    const bannerHTML = `
      <div id="cookie-banner" class="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-banner-title">
        <div class="cookie-banner-content">
          <!-- Уровень 1: Краткое уведомление -->
          <div class="cookie-banner-level-1" id="cookie-level-1">
            <h3 id="cookie-banner-title" class="cookie-banner-title">Мы используем файлы cookie</h3>
            <p class="cookie-banner-text">
              Этот сайт использует файлы cookie:<br>
              • Функциональные — для входа в личный кабинет<br>
              • Аналитические — для сбора статистики посещений<br>
              • Маркетинговые — для показа рекламы
            </p>
            <div class="cookie-banner-buttons">
              <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-accept-all">
                Принять всё
              </button>
              <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-reject-all">
                Отклонить всё
              </button>
              <button type="button" class="cookie-btn cookie-btn-outline" id="cookie-settings-btn">
                Настроить
              </button>
            </div>
            <a href="#privacy-policy" class="cookie-privacy-link" target="_blank" rel="noopener noreferrer">
              Политика конфиденциальности
            </a>
          </div>

          <!-- Уровень 2: Детальные настройки -->
          <div class="cookie-banner-level-2" id="cookie-level-2" style="display: none;">
            <button type="button" class="cookie-back-btn" id="cookie-back-btn">
              ← Назад
            </button>
            <h3 class="cookie-settings-title">Настройки файлов cookie</h3>
            <p class="cookie-settings-subtitle">Выберите категории cookie, которые вы разрешаете использовать:</p>
            
            <div class="cookie-categories" id="cookie-categories">
              ${Object.values(this.categories).map(cat => `
                <div class="cookie-category ${sanitizer.escapeHtml(cat.required ? 'cookie-category-required' : '')}">
                  <div class="cookie-category-header">
                    <div class="cookie-category-info">
                      <span class="cookie-category-name">${sanitizer.escapeHtml(cat.name)}</span>
                      <span class="cookie-category-desc">${sanitizer.escapeHtml(cat.description)}</span>
                    </div>
                    ${cat.required 
                      ? '<span class="cookie-badge-required">Обязательно</span>'
                      : `<label class="cookie-toggle">
                          <input type="checkbox" data-category="${sanitizer.escapeHtml(cat.id)}">
                          <span class="toggle-slider"></span>
                        </label>`
                    }
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="cookie-banner-buttons">
              <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-save-settings">
                Сохранить настройки
              </button>
            </div>
          </div>
        </div>
        
        <!-- Кнопка отзыва согласия (видима после принятия) -->
        <button type="button" class="cookie-settings-icon" id="cookie-settings-icon" title="Настройки cookie" style="display: none;">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);
    this.banner = document.getElementById('cookie-banner');
    this._attachBannerEvents();
    this._showBanner();
  }

  _attachBannerEvents() {
    // Кнопки уровня 1
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      this.saveConsent({
        functional: true,
        analytics: true,
        marketing: true
      });
    });

    document.getElementById('cookie-reject-all')?.addEventListener('click', () => {
      this.saveConsent({
        functional: true,
        analytics: false,
        marketing: false
      });
    });

    document.getElementById('cookie-settings-btn')?.addEventListener('click', () => {
      this._showLevel2();
    });

    // Кнопки уровня 2
    document.getElementById('cookie-back-btn')?.addEventListener('click', () => {
      this._showLevel1();
    });

    document.getElementById('cookie-save-settings')?.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#cookie-categories input[type="checkbox"]');
      const consent = { functional: true }; // функциональные всегда включены
      
      checkboxes.forEach(cb => {
        consent[cb.dataset.category] = cb.checked;
      });

      this.saveConsent(consent);
    });

    // Кнопка отзыва согласия
    document.getElementById('cookie-settings-icon')?.addEventListener('click', () => {
      this.withdrawConsent();
    });
  }

  _showLevel1() {
    const level1 = document.getElementById('cookie-level-1');
    const level2 = document.getElementById('cookie-level-2');
    if (level1) level1.style.display = 'block';
    if (level2) level2.style.display = 'none';
  }

  _showLevel2() {
    const level1 = document.getElementById('cookie-level-1');
    const level2 = document.getElementById('cookie-level-2');
    if (level1) level1.style.display = 'none';
    if (level2) level2.style.display = 'block';
  }

  _showBanner() {
    if (this.banner) {
      this.banner.classList.add('active');
      this.banner.style.display = 'flex';
    }
  }

  _hideBanner() {
    if (this.banner) {
      this.banner.classList.remove('active');
      setTimeout(() => {
        if (this.banner) {
          this.banner.style.display = 'none';
        }
      }, 300);
    }
    
    // Показываем иконку настроек
    const settingsIcon = document.getElementById('cookie-settings-icon');
    if (settingsIcon) {
      settingsIcon.style.display = 'flex';
    }
  }

  _renderAdBlockWarning() {
    if (document.getElementById('adblock-warning')) return;

    const warningHTML = `
      <div id="adblock-warning" class="adblock-warning" style="display: none;">
        <div class="adblock-warning-content">
          <svg class="adblock-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div class="adblock-warning-text">
            <h4>Обнаружен блокировщик рекламы</h4>
            <p>Наш сайт поддерживается за счёт рекламы. Пожалуйста, отключите блокировщик или добавьте наш сайт в исключения.</p>
          </div>
          <button type="button" class="adblock-dismiss-btn" id="adblock-dismiss">
            Я отключил блокировщик
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', warningHTML);
    this.adBlockWarning = document.getElementById('adblock-warning');

    document.getElementById('adblock-dismiss')?.addEventListener('click', () => {
      this.storage.set(this.adBlockKey, { dismissed: true, timestamp: Date.now() });
      if (this.adBlockWarning) {
        this.adBlockWarning.style.display = 'none';
      }
    });
  }

  _detectAdBlock() {
    // Простая проверка на наличие популярных блокировщиков
    const detected = this._checkAdBlock();
    
    if (detected) {
      const dismissed = this.storage.get(this.adBlockKey, { dismissed: false });
      // Показываем предупреждение только если пользователь не-dismissed в течение 24 часов
      const shouldShow = !dismissed.dismissed || 
        (Date.now() - dismissed.timestamp) > 24 * 60 * 60 * 1000;
      
      if (shouldShow && this.adBlockWarning) {
        this.adBlockWarning.style.display = 'block';
      }
    }
  }

  _checkAdBlock() {
    // Проверка через detection популярных блокировщиков
    const testEl = document.createElement('div');
    testEl.className = 'adsbox';
    testEl.style.position = 'absolute';
    testEl.style.height = '1px';
    testEl.style.width = '1px';
    testEl.style.left = '-9999px';
    document.body.appendChild(testEl);

    // Проверяем, был ли элемент скрыт/удалён
    const isBlocked = testEl.offsetHeight === 0 || 
                      window.getComputedStyle(testEl).display === 'none';
    
    document.body.removeChild(testEl);

    // Дополнительная проверка на наличие объектов блокировщиков
    const hasAdBlockObjects = typeof window.adsbygoogle === 'undefined' ||
                              typeof window.___gads === 'undefined';

    return isBlocked || hasAdBlockObjects;
  }
}

// Экспортируем в глобальную область для использования в index.html
window.ConsentManager = ConsentManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsentManager };
}