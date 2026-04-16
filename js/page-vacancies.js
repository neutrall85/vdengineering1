// Инициализация обработчиков после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
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

  // Обработчик для кнопки "Наверх"
  const scrollToTopBtn = document.getElementById('scrollToTop');
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function() {
      if (typeof window.scrollToTop === 'function') {
        window.scrollToTop();
      }
    });
  }
});
