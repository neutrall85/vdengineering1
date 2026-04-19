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
      this.banner.classList.add('active', 'visible');
      this.banner.classList.remove('hidden');
    }
  }

  hide() {
    if (this.banner) {
      this.banner.classList.remove('active');
      this.banner.classList.add('hidden');
      this.banner.classList.remove('visible');
    }
    
    if (this.settingsIcon) {
      this.settingsIcon.classList.add('visible');
      this.settingsIcon.classList.remove('hidden');
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
            </div>
            <div class="user-notice-links">
              <a href="#" class="user-privacy-link" id="user-privacy-link">
                Политика конфиденциальности
              </a>
              <a href="#" class="user-privacy-link" id="user-cookie-policy-link">
                Политика в отношении файлов cookie
              </a>
            </div>
          </div>
        </div>
        
        <!-- Кнопка отзыва согласия (видима после принятия) -->
        <button type="button" class="user-settings-icon" id="user-settings-icon" title="Настройки">
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
    // Кнопки cookie баннера
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

    // Ссылка на политику конфиденциальности - открывает модальное окно
    document.getElementById('user-privacy-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof ComponentLoader !== 'undefined' && ComponentLoader.openPolicyModal) {
        ComponentLoader.openPolicyModal('privacy');
      }
    });

    // Ссылка на политику в отношении файлов cookie - открывает модальное окно
    document.getElementById('user-cookie-policy-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof ComponentLoader !== 'undefined' && ComponentLoader.openPolicyModal) {
        ComponentLoader.openPolicyModal('cookie');
      }
    });

    // Кнопка отзыва согласия
    document.getElementById('user-settings-icon')?.addEventListener('click', () => {
      this.preferencesService.withdrawConsent();
    });
  }

  _showLevel1() {
    const level1 = document.getElementById('user-notice-level-1');
    if (level1) {
      level1.classList.remove('hidden');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserNoticeUI };
}
