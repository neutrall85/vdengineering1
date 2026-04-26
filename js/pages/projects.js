const projectsData = {
  1: {
    title: 'Модернизация Ан-124-100',
    details: ['Замена авионики на современную', 'Установка новых двигателей', 'Модернизация навигационных систем', 'Обновление системы управления полётом', 'Улучшение топливной эффективности'],
    images: [
      'assets/images/An-124-100.webp',
      'assets/images/airplane_in_the_sky.webp',
      'assets/images/engine.webp',
      'assets/images/aiplane_in_the_sky_large.webp'
    ],
    category: 'Модификация воздушных судов'
  }
};

function initProjectsPage() {
  if (window._projectsPageInitialized) {
    return;
  }
  window._projectsPageInitialized = true;

  const requestQuoteBtn = document.getElementById('projectsRequestQuoteBtn');
  if (requestQuoteBtn) {
    requestQuoteBtn.addEventListener('click', handleRequestQuote);
  }
}

function handleRequestQuote() {
  if (typeof window.openApplicationModal === 'function') {
    window.openApplicationModal();
  }
}

function openProjectModal(title, details, images, category) {
  const modalTitle = document.getElementById('projectModalTitle');
  const modalContent = document.getElementById('projectModalContent');
  const modalCategory = document.getElementById('projectModalCategory');
  const modalImageContainer = document.getElementById('projectModalImageContainer');
  const modalImage = document.getElementById('projectModalImage');

  if (!modalTitle || !modalContent || !modalCategory) {
    Logger.WARN('Элементы модального окна проекта не найдены');
    return;
  }

  const sanitizer = window.Utils?.Sanitizer;
  modalTitle.textContent = sanitizer ? sanitizer.escapeHtml(title) : title;
  modalCategory.textContent = sanitizer ? sanitizer.escapeHtml(category) : category;
  
  modalContent.replaceChildren();
  const ul = document.createElement('ul');
  ul.className = 'modal-list-ul';
  details.forEach(item => {
    const li = document.createElement('li');
    li.className = 'modal-list-li';
    li.textContent = sanitizer ? sanitizer.escapeHtml(item) : item;
    ul.appendChild(li);
  });
  modalContent.appendChild(ul);

  initProjectGallery(images, modalImageContainer, modalImage);

  if (typeof modalManager !== 'undefined') {
    modalManager.open('project');
  } else {
    Logger.ERROR('ModalManager не доступен');
  }
}

function initProjectGallery(images, container, mainImage) {
  const sanitizer = window.Utils?.Sanitizer;
  
  // Полностью очищаем контейнер перед инициализацией
  if (container) {
    container.replaceChildren();
  }
  
  // Сбрасываем стили и обработчики основного изображения
  if (mainImage) {
    mainImage.src = '';
    mainImage.alt = '';
    mainImage.style.cursor = '';
    mainImage.replaceWith(mainImage.cloneNode(false));
  }
  
  const newMainImage = document.getElementById('projectModalImage');
  const newContainer = document.getElementById('projectModalImageContainer');
  
  if (!images || images.length === 0) {
    if (newMainImage) {
      newMainImage.src = 'assets/images/placeholder.jpg';
      newMainImage.alt = 'Изображение проекта';
    }
    return;
  }
  
  let currentIndex = 0;
  
  function updateMainImage(index) {
    if (!newMainImage) return;
    const safeUrl = sanitizer && sanitizer.isValidUrl 
      ? (sanitizer.isValidUrl(images[index]) ? images[index] : 'assets/images/placeholder.jpg')
      : images[index];
    newMainImage.src = safeUrl;
    newMainImage.alt = `Изображение ${index + 1} из ${images.length}`;
  }
  
  function openLightbox() {
    if (typeof window.openProjectLightbox === 'function') {
      window.openProjectLightbox(images, currentIndex);
    } else {
      Logger.WARN('openProjectLightbox ещё не загружена');
    }
  }
  
  if (images.length === 1) {
    updateMainImage(0);
    if (newMainImage) {
      newMainImage.style.cursor = 'zoom-in';
      newMainImage.addEventListener('click', openLightbox, { once: false });
    }
    return;
  }
  
  // Создаём кнопку "Назад"
  const prevBtn = createNavButton('gallery-nav gallery-nav-prev', 'Предыдущее изображение', 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z');
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateMainImage(currentIndex);
    // Обновляем активный индикатор
    const indicators = newContainer.querySelectorAll('.gallery-indicator');
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));
  });
  newContainer.appendChild(prevBtn);
  
  // Оборачиваем изображение
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'gallery-image-wrapper';
  if (newMainImage.parentNode) {
    newMainImage.parentNode.insertBefore(imageWrapper, newMainImage);
    imageWrapper.appendChild(newMainImage);
  }
  
  // Создаём кнопку "Вперёд"
  const nextBtn = createNavButton('gallery-nav gallery-nav-next', 'Следующее изображение', 'M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z');
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateMainImage(currentIndex);
    // Обновляем активный индикатор
    const indicators = newContainer.querySelectorAll('.gallery-indicator');
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));
  });
  newContainer.appendChild(nextBtn);
  
  // Создаём индикаторы
  const indicatorsContainer = document.createElement('div');
  indicatorsContainer.className = 'gallery-indicators';
  
  images.forEach((_, index) => {
    const indicator = document.createElement('button');
    indicator.className = 'gallery-indicator' + (index === 0 ? ' active' : '');
    indicator.setAttribute('aria-label', `Изображение ${index + 1}`);
    indicator.addEventListener('click', () => {
      currentIndex = index;
      updateMainImage(currentIndex);
      indicatorsContainer.querySelectorAll('.gallery-indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === index);
      });
    });
    indicatorsContainer.appendChild(indicator);
  });
  
  newContainer.appendChild(indicatorsContainer);
  
  // Устанавливаем первое изображение
  updateMainImage(0);
  
  // Добавляем обработчик клика для открытия лайтбокса
  if (newMainImage) {
    newMainImage.style.cursor = 'zoom-in';
    newMainImage.addEventListener('click', openLightbox, { once: false });
  }
}

function createNavButton(className, ariaLabel, pathData) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.setAttribute('aria-label', ariaLabel);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  btn.appendChild(svg);
  return btn;
}

function openProjectLightbox(images, startIndex = 0) {
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxIndicators = document.getElementById('lightboxIndicators');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  
  if (!lightboxOverlay || !lightboxImage) {
    Logger.WARN('Lightbox элементы не найдены');
    return;
  }
  
  const sanitizer = window.Utils?.Sanitizer;
  let currentIndex = startIndex;
  
  function updateLightboxImage(index) {
    const safeUrl = sanitizer && sanitizer.isValidUrl 
      ? (sanitizer.isValidUrl(images[index]) ? images[index] : 'assets/images/placeholder.jpg')
      : images[index];
    lightboxImage.src = safeUrl;
    lightboxImage.alt = `Изображение ${index + 1} из ${images.length}`;
    
    if (lightboxIndicators) {
      lightboxIndicators.querySelectorAll('.lightbox-indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === index);
      });
    }
  }
  
  if (lightboxIndicators) {
    lightboxIndicators.replaceChildren();
    if (images.length > 1) {
      images.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'lightbox-indicator' + (index === startIndex ? ' active' : '');
        indicator.setAttribute('aria-label', `Изображение ${index + 1}`);
        indicator.addEventListener('click', () => {
          currentIndex = index;
          updateLightboxImage(currentIndex);
        });
        lightboxIndicators.appendChild(indicator);
      });
    }
  }
  
  function navigate(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    updateLightboxImage(currentIndex);
  }
  
  if (prevBtn) {
    prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
    prevBtn.onclick = () => navigate(-1);
  }
  
  if (nextBtn) {
    nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
    nextBtn.onclick = () => navigate(1);
  }
  
  updateLightboxImage(currentIndex);
  lightboxOverlay.classList.add('active');
  
  if (window.ScrollManager && !ScrollManager.isLocked()) {
    ScrollManager.lock();
  }
  
  const closeBtn = document.getElementById('lightboxCloseBtn');
  const closeHandler = () => closeLightbox(lightboxOverlay, lightboxImage, prevBtn, nextBtn);
  
  if (closeBtn) {
    closeBtn.onclick = closeHandler;
  }
  
  lightboxOverlay.onclick = (e) => {
    if (e.target === lightboxOverlay) {
      closeHandler();
    }
  };
  
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      closeHandler();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

function closeLightbox(lightboxOverlay, lightboxImage, prevBtn, nextBtn) {
  if (!lightboxOverlay) return;
  
  lightboxOverlay.classList.remove('active');
  
  if (window.ScrollManager) {
    ScrollManager.unlock();
  }
  
  setTimeout(() => {
    if (lightboxImage) {
      lightboxImage.src = '';
    }
  }, 300);
  
  if (prevBtn) prevBtn.onclick = null;
  if (nextBtn) nextBtn.onclick = null;
  const closeBtn = document.getElementById('lightboxCloseBtn');
  if (closeBtn) closeBtn.onclick = null;
  lightboxOverlay.onclick = null;
}

window.initProjectsPage = initProjectsPage;
window.openProjectModal = openProjectModal;
window.openProjectLightbox = openProjectLightbox;
