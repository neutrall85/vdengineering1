/**
 * Главный файл инициализации приложения
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Рефакторинг: делегирует всю логику классу App из js/core/App.js
 */

// Функция инициализации после загрузки всех скриптов
function initApp() {
  
  // Проверяем наличие глобальных объектов
  const hasConfig = typeof window.CONFIG !== 'undefined';
  const hasServices = typeof window.Services !== 'undefined';
  const hasUtils = typeof window.Utils !== 'undefined';
  const hasApp = typeof window.App !== 'undefined';
  
  if (!hasConfig || !hasServices || !hasUtils) {
    setTimeout(() => initApp(), 100);
    return;
  }
  
  // 1. Инициализация менеджеров новостей
  if (typeof NEWS_DATA !== 'undefined') {
    try {
      if (typeof NewsRenderer !== 'undefined' && typeof NewsManager !== 'undefined') {
        window.newsRenderer = new NewsRenderer(NEWS_DATA);
        window.newsManager = new NewsManager(NEWS_DATA, window.newsRenderer);
        window.newsManager.init();
        
        // Инициализация роутинга новостей если доступен
        if (typeof NewsNavigation !== 'undefined') {
          NewsNavigation.init(window.newsManager);
        }
      } else {
        Logger.ERROR('NewsRenderer или NewsManager не определен');
      }
    } catch (err) {
      Logger.ERROR('Ошибка инициализации менеджеров новостей:', err);
    }
  }
  
  // 2. Инициализация FormManager (после ComponentLoader!)
  if (hasServices && hasUtils) {
    try {
      const formRateLimiter = new Utils.RateLimiter(window.Services.storage);
      window.formManager = new FormManager(
        window.Services.apiClient, 
        formRateLimiter, 
        Utils.Validator
      );
      window.formManager.init();
    } catch (err) {
      Logger.ERROR('Failed to initialize FormManager:', err);
    }
  } else {
    Logger.WARN('Required services or utils are not available for FormManager initialization');
  }
  
  // 3. Инициализация DocPreviewManager для страницы документов
  if (typeof DocPreviewManager !== 'undefined') {
    DocPreviewManager.init();
  }
  
  // 4. Инициализация ConsentManager для обработки предпочтений пользователя
  if (typeof ConsentManager !== 'undefined') {
    try {
      const consentManager = new ConsentManager(window.Services.storage);
      consentManager.init();
      window.consentManager = consentManager;
    } catch (err) {
      console.error('Failed to initialize ConsentManager:', err);
    }
  }

  // 5. Запуск основного приложения через новый класс App с DI
  if (hasApp) {
    const app = new window.App();
    app.init();
  } else {
    Logger.ERROR('App class is not available');
  }
}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Авторасширение textarea
document.addEventListener('input', function(e) {
  if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('form-textarea')) {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  }
});
