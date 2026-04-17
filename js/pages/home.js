/**
 * Инициализация главной страницы (index.html)
 * ООО "Волга-Днепр Инжиниринг"
 */

import { NewsCardRenderer } from '../ui/NewsCardRenderer.js';

/**
 * Рендерит превью последних новостей на главной странице
 * @param {Array} newsList - Массив объектов новостей
 * @param {string} containerId - ID контейнера для рендеринга
 * @param {number} limit - Количество новостей для отображения
 */
export function renderNewsPreview(newsList, containerId = 'previewNewsGrid', limit = 3) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.warn('Контейнер для превью новостей не найден:', containerId);
    return;
  }

  if (!newsList || newsList.length === 0) {
    container.innerHTML = '<p class="no-news">Нет новостей для отображения</p>';
    return;
  }

  // Берем только последние N новостей
  const recentNews = newsList.slice(0, limit);
  
  // Создаем фрагмент для эффективной вставки
  const fragment = document.createDocumentFragment();
  
  recentNews.forEach(news => {
    // Используем общий рендерер для создания идентичных карточек
    const card = NewsCardRenderer.createCard(news);
    card.classList.add('news-card--preview');
    fragment.appendChild(card);
  });
  
  container.appendChild(fragment);
}

/**
 * Инициализирует главную страницу
 * @param {Object} newsData - Объект с данными новостей по годам
 */
export function initHomePage(newsData) {
  // Собираем все новости из всех лет в один массив
  const allNews = [];
  
  // Преобразуем объект { year: [news...] } в плоский массив
  Object.keys(newsData).forEach(year => {
    if (Array.isArray(newsData[year])) {
      allNews.push(...newsData[year]);
    }
  });
  
  // Сортируем по дате (новые первыми)
  allNews.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  
  // Рендерим превью новостей
  renderNewsPreview(allNews, 'previewNewsGrid', 3);
  
  console.log('Главная страница инициализирована. Показано новостей:', Math.min(allNews.length, 3));
}

// Экспортируем для использования в app.js
window.initHomePage = initHomePage;
