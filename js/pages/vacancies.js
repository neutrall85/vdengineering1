/**
 * Инициализация обработчиков для страницы вакансий
 * ООО "Волга-Днепр Инжиниринг"
 */

// Экспортируем функцию инициализации для module режима
export function initVacanciesPage() {
  // Обработчики для кнопок "Откликнуться" на вакансии
  const applyButtons = document.querySelectorAll('.vacancy-apply-btn');
  applyButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof window.openUniversalApplicationModal === 'function') {
        window.openUniversalApplicationModal('vacancy');
      }
    });
  });
  
  // Обработчик для кнопки "Оставить заявку"
  const applicationBtn = document.getElementById('vacanciesApplicationBtn');
  if (applicationBtn) {
    applicationBtn.addEventListener('click', function() {
      if (typeof window.openUniversalApplicationModal === 'function') {
        window.openUniversalApplicationModal('application');
      }
    });
  }
}

// Автозапуск если не используется как модуль, или ожидание DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVacanciesPage);
} else {
  initVacanciesPage();
}
