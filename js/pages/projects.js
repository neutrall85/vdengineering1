window.projectsData = {
  1: {
    title: 'Модернизация',
    details: ['Реализация 1', 'Реализация 2', 'Реализация 3', 'Реализация 4', 'Реализация 5'],
    images: [
      'assets/images/placeholder.jpg',
      'assets/images/placeholder.jpg',
      'assets/images/placeholder.jpg',
      'assets/images/placeholder.jpg'
    ],
    category: 'Модернизация воздушных судов'
  }
};

// Хранилище для обработчиков страницы проектов
const _projectsPageHandlers = {
  requestQuoteHandler: null,
  escapeKeyHandler: null,
  lightboxImageClickHandler: null,
  galleryPrevHandler: null,
  galleryNextHandler: null,
  indicatorHandlers: new Map()
};

function initProjectsPage() {
  if (window._projectsPageInitialized) {
    return;
  }
  window._projectsPageInitialized = true;

  // Обработчики для кнопок "Подробнее" теперь централизованы в ModalManager через data-modal-open
  
  const requestQuoteBtn = document.getElementById('projectsRequestQuoteBtn');
  if (requestQuoteBtn) {
    _projectsPageHandlers.requestQuoteHandler = handleRequestQuote;
    requestQuoteBtn.addEventListener('click', _projectsPageHandlers.requestQuoteHandler);
  }
}

function handleRequestQuote() {
  // Используем централизованное открытие через data-modal-open="application"
  const fakeTrigger = document.createElement('button');
  fakeTrigger.setAttribute('data-modal-open', 'application');
  document.body.appendChild(fakeTrigger);
  fakeTrigger.click();
  document.body.removeChild(fakeTrigger);
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
  
  // Используем существующий элемент изображения без замены
  const newMainImage = mainImage || document.getElementById('projectModalImage');
  const newContainer = container || document.getElementById('projectModalImageContainer');
  
  if (!newMainImage || !newContainer) {
    Logger.WARN('Элементы галереи проекта не найдены');
    return;
  }
  
  if (!images || images.length === 0) {
    newMainImage.src = 'assets/images/placeholder.jpg';
    newMainImage.alt = 'Изображение проекта';
    return;
  }
  
  let currentIndex = 0;
  
  function updateMainImage(index) {
    const safeUrl = sanitizer && sanitizer.isValidUrl 
      ? (sanitizer.isValidUrl(images[index]) ? images[index] : 'assets/images/placeholder.jpg')
      : images[index];
    newMainImage.src = safeUrl;
    newMainImage.alt = `Изображение ${index + 1} из ${images.length}`;
  }
  
  function openLightbox() {
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    const lightboxImage = document.getElementById('lightboxImage');
    
    if (!lightboxOverlay || !lightboxImage) {
      Logger.WARN('Lightbox элементы не найдены');
      return;
    }
    
    let currentIndexLocal = currentIndex;
    
    function updateLightboxImage(index) {
      const safeUrl = sanitizer && sanitizer.isValidUrl 
        ? (sanitizer.isValidUrl(images[index]) ? images[index] : 'assets/images/placeholder.jpg')
        : images[index];
      lightboxImage.src = safeUrl;
      lightboxImage.alt = `Изображение ${index + 1} из ${images.length}`;
      
      const lightboxIndicators = document.getElementById('lightboxIndicators');
      if (lightboxIndicators) {
        lightboxIndicators.querySelectorAll('.lightbox-indicator').forEach((ind, i) => {
          ind.classList.toggle('active', i === index);
        });
      }
    }
    
    const lightboxIndicators = document.getElementById('lightboxIndicators');
    if (lightboxIndicators) {
      lightboxIndicators.replaceChildren();
      if (images.length > 1) {
        images.forEach((_, index) => {
          const indicator = document.createElement('button');
          indicator.className = 'lightbox-indicator' + (index === currentIndexLocal ? ' active' : '');
          indicator.setAttribute('aria-label', `Изображение ${index + 1}`);
          indicator.addEventListener('click', () => {
            currentIndexLocal = index;
            updateLightboxImage(currentIndexLocal);
          });
          lightboxIndicators.appendChild(indicator);
        });
      }
    }
    
    function navigate(direction) {
      currentIndexLocal = (currentIndexLocal + direction + images.length) % images.length;
      updateLightboxImage(currentIndexLocal);
    }
    
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');
    
    if (prevBtn) {
      prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
      prevBtn.onclick = () => navigate(-1);
    }
    
    if (nextBtn) {
      nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
      nextBtn.onclick = () => navigate(1);
    }
    
    updateLightboxImage(currentIndexLocal);
    lightboxOverlay.classList.add('active');
    
    if (window.ScrollManager && !ScrollManager.isLocked()) {
      ScrollManager.lock();
    }
    
    const closeBtn = document.getElementById('lightboxCloseBtn');
    const closeHandler = () => {
      lightboxOverlay.classList.remove('active');
      if (window.ScrollManager) {
        ScrollManager.unlock();
      }
      setTimeout(() => {
        lightboxImage.src = '';
      }, 300);
      if (prevBtn) prevBtn.onclick = null;
      if (nextBtn) nextBtn.onclick = null;
      if (closeBtn) closeBtn.onclick = null;
      lightboxOverlay.onclick = null;
    };
    
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
  
  // Добавляем обработчик клика для открытия лайтбокса
  newMainImage.style.cursor = 'zoom-in';
  newMainImage.addEventListener('click', openLightbox, { once: false });
  
  if (images.length === 1) {
    updateMainImage(0);
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
  newContainer.appendChild(imageWrapper);
  imageWrapper.appendChild(newMainImage);
  
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

/**
 * Очистка ресурсов страницы проектов
 */
window.destroyProjectsPage = function() {
  // Удаляем обработчик кнопки запроса КП
  const requestQuoteBtn = document.getElementById('projectsRequestQuoteBtn');
  if (requestQuoteBtn && _projectsPageHandlers.requestQuoteHandler) {
    requestQuoteBtn.removeEventListener('click', _projectsPageHandlers.requestQuoteHandler);
    _projectsPageHandlers.requestQuoteHandler = null;
  }
  
  // Очищаем хранилище обработчиков
  if (_projectsPageHandlers.indicatorHandlers) {
    _projectsPageHandlers.indicatorHandlers.clear();
  }
  _projectsPageHandlers.escapeKeyHandler = null;
  _projectsPageHandlers.lightboxImageClickHandler = null;
  _projectsPageHandlers.galleryPrevHandler = null;
  _projectsPageHandlers.galleryNextHandler = null;
};

window.initProjectsPage = initProjectsPage;
window.openProjectModal = openProjectModal;
window.initProjectGallery = initProjectGallery;
window.destroyProjectsPage = destroyProjectsPage;
