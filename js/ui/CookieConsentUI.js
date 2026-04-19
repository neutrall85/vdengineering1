/**
 * UI компонент для отображения cookie-баннера
 * Отвечает только за представление и взаимодействие с пользователем
 */

class CookieConsentUI {
  constructor(consentService, eventBus) {
    this.consentService = consentService;
    this.eventBus = eventBus;
    this.banner = null;
    this.settingsIcon = null;
  }

  init() {
    this._subscribeToEvents();
  }

  _subscribeToEvents() {
    this.eventBus.on('consent:required', () => this.show());
    this.eventBus.on('consent:saved', () => this.hide());
    this.eventBus.on('consent:withdrawn', () => this.show());
  }

  show() {
    if (!this.banner) {
      this._render();
    }
    
    if (this.banner) {
      this.banner.classList.add('active');
      this.banner.style.display = 'flex';
    }
  }

  hide() {
    if (this.banner) {
      this.banner.classList.remove('active');
      setTimeout(() => {
        if (this.banner) {
          this.banner.style.display = 'none';
        }
      }, 300);
    }
    
    if (this.settingsIcon) {
      this.settingsIcon.style.display = 'flex';
    }
  }

  _render() {
    if (document.getElementById('cookie-banner')) return;

    const categories = this.consentService.getCategories();
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
              ${Object.values(categories).map(cat => `
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
    this.settingsIcon = document.getElementById('cookie-settings-icon');
    this._attachEvents();
  }

  _attachEvents() {
    // Кнопки уровня 1
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      this.consentService.saveConsent({
        functional: true,
        analytics: true,
        marketing: true
      });
    });

    document.getElementById('cookie-reject-all')?.addEventListener('click', () => {
      this.consentService.saveConsent({
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
      const consent = { functional: true };
      
      checkboxes.forEach(cb => {
        consent[cb.dataset.category] = cb.checked;
      });

      this.consentService.saveConsent(consent);
    });

    // Кнопка отзыва согласия
    document.getElementById('cookie-settings-icon')?.addEventListener('click', () => {
      this.consentService.withdrawConsent();
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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CookieConsentUI };
}
