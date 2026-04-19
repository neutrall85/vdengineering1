/**
 * UI компонент для отображения уведомлений о предпочтениях пользователя
 * Отвечает только за представление и взаимодействие с пользователем
 * Использует нейтральные названия классов для избежания блокировок
 * DRY, KISS - единая ответственность за UI
 */

class UserNoticeUI {
  constructor(preferencesService, eventBus) {
    this.preferencesService = preferencesService;
    this.eventBus = eventBus;
    this.banner = null;
    this.settingsIcon = null;
  }

  init() {
    this._subscribeToEvents();
    // Проверяем состояние согласия после подписки на события
    const consent = this.preferencesService.getConsent();
    if (!consent) {
      this.show();
    }
  }

  _subscribeToEvents() {
    this.eventBus.on('preferences:required', () => this.show());
    this.eventBus.on('preferences:saved', () => this.hide());
    this.eventBus.on('preferences:withdrawn', () => this.show());
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
    if (document.getElementById('user-notice-banner')) return;

    const categories = this.preferencesService.getCategories();
    const sanitizer = Utils.Sanitizer || { escapeHtml: (str) => str };
    
    const bannerHTML = `
      <div id="user-notice-banner" class="user-notice-banner" role="dialog" aria-modal="true" aria-labelledby="user-notice-title">
        <div class="user-notice-content">
          <!-- Уровень 1: Краткое уведомление -->
          <div class="user-notice-level-1" id="user-notice-level-1">
            <h3 id="user-notice-title" class="user-notice-title">Настройки сайта</h3>
            <p class="user-notice-text">
              Для улучшения работы сайта используются технологии хранения данных:<br>
              • Функциональные — для входа в личный кабинет<br>
              • Аналитические — для сбора статистики посещений<br>
              • Маркетинговые — для показа рекламы
            </p>
            <div class="user-notice-buttons">
              <button type="button" class="user-btn user-btn-primary" id="user-accept-all">
                Принять всё
              </button>
              <button type="button" class="user-btn user-btn-secondary" id="user-reject-all">
                Отклонить всё
              </button>
              <button type="button" class="user-btn user-btn-outline" id="user-settings-btn">
                Настроить
              </button>
            </div>
            <a href="#privacy-policy" class="user-privacy-link" target="_blank" rel="noopener noreferrer">
              Политика конфиденциальности
            </a>
          </div>

          <!-- Уровень 2: Детальные настройки -->
          <div class="user-notice-level-2" id="user-notice-level-2" style="display: none;">
            <button type="button" class="user-back-btn" id="user-back-btn">
              ← Назад
            </button>
            <h3 class="user-settings-title">Настройки хранения данных</h3>
            <p class="user-settings-subtitle">Выберите категории данных, которые вы разрешаете использовать:</p>
            
            <div class="user-categories" id="user-categories">
              ${Object.values(categories).map(cat => `
                <div class="user-category ${sanitizer.escapeHtml(cat.required ? 'user-category-required' : '')}">
                  <div class="user-category-header">
                    <div class="user-category-info">
                      <span class="user-category-name">${sanitizer.escapeHtml(cat.name)}</span>
                      <span class="user-category-desc">${sanitizer.escapeHtml(cat.description)}</span>
                    </div>
                    ${cat.required 
                      ? '<span class="user-badge-required">Обязательно</span>'
                      : `<label class="user-toggle">
                          <input type="checkbox" data-category="${sanitizer.escapeHtml(cat.id)}">
                          <span class="toggle-slider"></span>
                        </label>`
                    }
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="user-notice-buttons">
              <button type="button" class="user-btn user-btn-primary" id="user-save-settings">
                Сохранить настройки
              </button>
            </div>
          </div>
        </div>
        
        <!-- Кнопка отзыва согласия (видима после принятия) -->
        <button type="button" class="user-settings-icon" id="user-settings-icon" title="Настройки" style="display: none;">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHTML);
    this.banner = document.getElementById('user-notice-banner');
    this.settingsIcon = document.getElementById('user-settings-icon');
    this._attachEvents();
  }

  _attachEvents() {
    // Кнопки уровня 1
    document.getElementById('user-accept-all')?.addEventListener('click', () => {
      this.preferencesService.saveConsent({
        functional: true,
        analytics: true,
        marketing: true
      });
    });

    document.getElementById('user-reject-all')?.addEventListener('click', () => {
      this.preferencesService.saveConsent({
        functional: true,
        analytics: false,
        marketing: false
      });
    });

    document.getElementById('user-settings-btn')?.addEventListener('click', () => {
      this._showLevel2();
    });

    // Кнопки уровня 2
    document.getElementById('user-back-btn')?.addEventListener('click', () => {
      this._showLevel1();
    });

    document.getElementById('user-save-settings')?.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#user-categories input[type="checkbox"]');
      const consent = { functional: true };
      
      checkboxes.forEach(cb => {
        consent[cb.dataset.category] = cb.checked;
      });

      this.preferencesService.saveConsent(consent);
    });

    // Кнопка отзыва согласия
    document.getElementById('user-settings-icon')?.addEventListener('click', () => {
      this.preferencesService.withdrawConsent();
    });
  }

  _showLevel1() {
    const level1 = document.getElementById('user-notice-level-1');
    const level2 = document.getElementById('user-notice-level-2');
    if (level1) level1.style.display = 'block';
    if (level2) level2.style.display = 'none';
  }

  _showLevel2() {
    const level1 = document.getElementById('user-notice-level-1');
    const level2 = document.getElementById('user-notice-level-2');
    if (level1) level1.style.display = 'none';
    if (level2) level2.style.display = 'block';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserNoticeUI };
}
