/**
 * FileUploadService - единый сервис для работы с файлами
 * ООО "Волга-Днепр Инжиниринг"
 * 
 * Объединяет логику загрузки файлов из FormManager и ComponentLoader
 * Устраняет дублирование методов _handleFileSelect, _renderFileList
 */

const FileUploadService = (function() {
  // Конфигурация по умолчанию
  const defaultConfig = {
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  };

  // Хранилище файлов для каждой зоны загрузки
  const fileStores = new Map();
  
  // Таймер для скрытия предупреждений
  let warningTimeout = null;

  /**
   * Инициализация зоны загрузки
   * @param {HTMLElement} container - контейнер зоны загрузки
   * @param {Object} options - опции
   * @returns {Object} API для управления зоной
   */
  function initDropZone(container, options = {}) {
    const config = { ...defaultConfig, ...options };
    const dropZoneId = container.id || `dropzone-${Date.now()}`;
    
    // Инициализируем хранилище для этой зоны
    fileStores.set(dropZoneId, []);
    
    const fileInput = container.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.setAttribute('multiple', 'multiple');
      fileInput.setAttribute('accept', config.allowedTypes.map(t => `.${t}`).join(','));
    }

    // Добавляем обработчики если еще не добавлены
    if (!container._fileUploadInitialized) {
      _attachEventListeners(container, dropZoneId, config);
      container._fileUploadInitialized = true;
    }

    return {
      getFiles: () => fileStores.get(dropZoneId) || [],
      setFiles: (files) => fileStores.set(dropZoneId, files),
      addFiles: (files) => _addFiles(files, dropZoneId, config),
      removeFile: (index) => _removeFile(index, dropZoneId, container),
      clear: () => {
        fileStores.set(dropZoneId, []);
        _renderFileList(container, dropZoneId);
      },
      destroy: () => _detachEventListeners(container)
    };
  }

  /**
   * Прикрепление обработчиков событий
   */
  function _attachEventListeners(container, dropZoneId, config) {
    const fileInput = container.querySelector('input[type="file"]');
    
    // Обработчик выбора через input
    if (fileInput && !fileInput._changeHandlerAttached) {
      fileInput.addEventListener('change', (e) => {
        _addFiles(e.target.files, dropZoneId, config);
      });
      fileInput._changeHandlerAttached = true;
    }

    // Drag & Drop обработчики
    if (!container._dragDropHandlerAttached) {
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.style.borderColor = 'var(--vd-blue)';
        container.style.background = 'rgba(0, 51, 160, 0.05)';
      });

      container.addEventListener('dragleave', () => {
        container.style.borderColor = '';
        container.style.background = '';
      });

      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.style.borderColor = '';
        container.style.background = '';
        _addFiles(e.dataTransfer.files, dropZoneId, config);
      });
      
      container._dragDropHandlerAttached = true;
    }

    // Делегирование кликов для кнопок удаления
    if (!container._clickHandlerAttached) {
      container.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.form-file-item-remove');
        if (removeBtn) {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(removeBtn.getAttribute('data-index'), 10);
          _removeFile(index, dropZoneId, container);
        }
      });
      container._clickHandlerAttached = true;
    }
  }

  /**
   * Открепление обработчиков событий
   */
  function _detachEventListeners(container) {
    // Можно добавить очистку обработчиков при необходимости
    container._fileUploadInitialized = false;
  }

  /**
   * Добавление файлов
   */
  function _addFiles(files, dropZoneId, config) {
    if (!files || files.length === 0) return;

    const currentFiles = fileStores.get(dropZoneId) || [];
    const errors = [];
    const validNewFiles = [];

    for (const file of Array.from(files)) {
      // Проверка размера
      if (file.size > config.maxFileSize) {
        errors.push(`Файл "${file.name}" превышает 10MB`);
        continue;
      }

      // Проверка типа
      const extension = file.name.split('.').pop().toLowerCase();
      if (!config.allowedTypes.includes(extension)) {
        errors.push(`Недопустимый тип файла: ${file.name}`);
        continue;
      }

      if (file.type && !config.allowedMimeTypes.includes(file.type)) {
        errors.push(`Недопустимый MIME-тип: ${file.name}`);
        continue;
      }

      // Проверка на дубликаты
      const fileKey = `${file.name}:${file.size}`;
      const isDuplicate = currentFiles.some(f => `${f.name}:${f.size}` === fileKey);
      if (isDuplicate) {
        errors.push(`Файл "${file.name}" уже добавлен`);
        continue;
      }

      const isDuplicateInBatch = validNewFiles.some(f => `${f.name}:${f.size}` === fileKey);
      if (isDuplicateInBatch) {
        errors.push(`Файл "${file.name}" уже добавлен в этой партии`);
        continue;
      }

      validNewFiles.push(file);
    }

    // Проверка лимита количества
    const totalAfterAdd = currentFiles.length + validNewFiles.length;
    let filesToAdd = validNewFiles;
    
    if (totalAfterAdd > config.maxFiles) {
      const space = config.maxFiles - currentFiles.length;
      if (space <= 0) {
        errors.push(`Достигнут лимит файлов (${config.maxFiles})`);
        filesToAdd = [];
      } else {
        filesToAdd = validNewFiles.slice(0, space);
        errors.push(`Добавлено ${space} из ${validNewFiles.length} файлов. Лимит ${config.maxFiles}.`);
      }
    }

    // Обновляем хранилище
    fileStores.set(dropZoneId, [...currentFiles, ...filesToAdd]);

    // Показываем ошибки
    if (errors.length > 0) {
      _showWarning([...new Set(errors)].join('; '), dropZoneId);
    }

    // Перерисовываем список
    const container = document.getElementById(dropZoneId) || 
                      document.querySelector(`[data-dropzone="${dropZoneId}"]`) ||
                      document.querySelector('.form-file');
    if (container) {
      _renderFileList(container, dropZoneId);
    }
  }

  /**
   * Удаление файла
   */
  function _removeFile(index, dropZoneId, container) {
    const files = fileStores.get(dropZoneId) || [];
    
    if (index >= 0 && index < files.length) {
      files.splice(index, 1);
      fileStores.set(dropZoneId, files);
      
      // Сбрасываем input value чтобы можно было добавить тот же файл снова
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      _renderFileList(container, dropZoneId);
    }
  }

  /**
   * Рендеринг списка файлов
   */
  function _renderFileList(container, dropZoneId) {
    const files = fileStores.get(dropZoneId) || [];
    
    // Находим или создаем контейнер списка
    let listContainer = container.querySelector('.form-file-list');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'form-file-list';
      container.appendChild(listContainer);
    }

    listContainer.replaceChildren();

    if (files.length === 0) {
      const fileText = container.querySelector('.form-file-text');
      if (fileText) fileText.textContent = 'Выбрать файл...';
      return;
    }

    files.forEach((file, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'form-file-item';
      itemDiv.setAttribute('data-index', index);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'form-file-item-name';
      nameSpan.textContent = file.name;

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'form-file-item-size';
      sizeSpan.textContent = _formatFileSize(file.size);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'form-file-item-remove';
      removeBtn.setAttribute('data-index', index);
      removeBtn.setAttribute('aria-label', 'Удалить файл');

      // SVG иконка
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
      svg.appendChild(path);
      removeBtn.appendChild(svg);

      itemDiv.appendChild(nameSpan);
      itemDiv.appendChild(sizeSpan);
      itemDiv.appendChild(removeBtn);
      listContainer.appendChild(itemDiv);
    });

    // Обновляем текст
    const fileText = container.querySelector('.form-file-text');
    if (fileText) fileText.textContent = `Выбрано файлов: ${files.length}`;
  }

  /**
   * Форматирование размера файла
   */
  function _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Показ предупреждения
   */
  function _showWarning(message, dropZoneId) {
    const container = document.getElementById(dropZoneId) || 
                      document.querySelector('.form-file');
    if (!container) return;

    let warningContainer = container.querySelector('.upload-warning-container');
    if (!warningContainer) {
      warningContainer = document.createElement('div');
      warningContainer.className = 'upload-warning-container';
      const input = container.querySelector('input[type="file"]');
      if (input && input.nextSibling) {
        container.insertBefore(warningContainer, input.nextSibling);
      } else {
        container.insertBefore(warningContainer, container.firstChild);
      }
    }

    warningContainer.replaceChildren();
    const warningDiv = document.createElement('div');
    warningDiv.className = 'upload-warning';
    warningDiv.textContent = `⚠️ ${message}`;
    warningContainer.appendChild(warningDiv);
    warningContainer.classList.remove('form-file-limit-hidden');

    // Очищаем предыдущий таймер
    if (warningTimeout) clearTimeout(warningTimeout);

    // Скрываем через 3 секунды
    warningTimeout = setTimeout(() => {
      warningContainer.classList.add('form-file-limit-hidden');
    }, 3000);
  }

  /**
   * Получение файлов из хранилища
   */
  function getFiles(dropZoneId) {
    return fileStores.get(dropZoneId) || [];
  }

  /**
   * Очистка всех хранилищ
   */
  function clearAll() {
    fileStores.clear();
  }

  return {
    initDropZone,
    getFiles,
    clearAll,
    defaultConfig
  };
})();

// Экспортируем в глобальную область
if (typeof window !== 'undefined') {
  window.FileUploadService = FileUploadService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileUploadService;
}
