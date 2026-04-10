/**
 * Управление формой
 * ООО "Волга-Днепр Инжиниринг"
 */

class FormManager {
  constructor(apiClient, rateLimiter, validator) {
    this.apiClient = apiClient;
    this.rateLimiter = rateLimiter;
    this.validator = validator;
    this.currentFiles = [];
    this.maxFiles = 5;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  init() {
    try {
      this._initFileUpload();
      this._initPhoneMask();
      this._initFormSubmit();
      this._initFloatingButton();
      console.log('FormManager initialized');
    } catch (error) {
      console.error('FormManager init failed:', error);
    }
  }

  _initFileUpload() {
    const fileInput = DOM.getElement('fileAttachment');
    const fileDrop = DOM.getElement('fileDrop');

    if (!fileInput || !fileDrop) return;

    // Добавляем атрибут multiple для поддержки нескольких файлов
    fileInput.setAttribute('multiple', 'multiple');
    fileInput.addEventListener('change', (e) => this._handleFileSelect(e.target.files));

    fileDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDrop.style.borderColor = 'var(--vd-blue)';
      fileDrop.style.background = 'rgba(0, 51, 160, 0.05)';
    });

    fileDrop.addEventListener('dragleave', () => {
      fileDrop.style.borderColor = '';
      fileDrop.style.background = '';
    });

    fileDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDrop.style.borderColor = '';
      fileDrop.style.background = '';
      this._handleFileSelect(e.dataTransfer.files);
    });
  }

  _handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter(file => {
      // Проверка размера файла
      if (file.size > this.maxFileSize) {
        this._showError(`Файл "${file.name}" превышает максимальный размер 10MB`);
        return false;
      }

      // Проверка типа файла
      const validation = this.validator.file(file);
      if (!validation.valid) {
        this._showError(validation.error);
        return false;
      }

      // Проверка на дубликаты
      const isDuplicate = this.currentFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        this._showError(`Файл "${file.name}" уже выбран`);
        return false;
      }

      return true;
    });

    // Добавляем новые файлы к существующим
    this.currentFiles = [...this.currentFiles, ...newFiles];

    // Ограничиваем количество файлов
    if (this.currentFiles.length > this.maxFiles) {
      this.currentFiles = this.currentFiles.slice(0, this.maxFiles);
      this._showError(`Максимальное количество файлов: ${this.maxFiles}`);
    }

    this._renderFileList();
  }

  _renderFileList() {
    const fileListContainer = DOM.getElement('fileList');

    // Если контейнер списка файлов не существует, создаём его
    if (!fileListContainer) {
      const fileDrop = DOM.getElement('fileDrop');
      if (!fileDrop) return;

      const container = document.createElement('div');
      container.id = 'fileList';
      container.className = 'form-file-list';
      fileDrop.appendChild(container);
    }

    const container = DOM.getElement('fileList');
    if (!container) return;

    if (this.currentFiles.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.currentFiles.map((file, index) => `
      <div class="form-file-item" data-index="${index}">
        <span class="form-file-item-name">${this._escapeHtml(file.name)}</span>
        <span class="form-file-item-size">${this._formatFileSize(file.size)}</span>
        <button type="button" class="form-file-item-remove" data-index="${index}" aria-label="Удалить файл">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.form-file-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'), 10);
        this.removeFile(index);
      });
    });

    // Обновляем текст в зоне загрузки
    const fileDropText = DOM.query('.form-file-text');
    if (fileDropText) {
      fileDropText.textContent = `Выбрано файлов: ${this.currentFiles.length}`;
    }
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  _showError(message) {
    console.error('Form error:', message);
    const warning = DOM.getElement('rateLimitWarning');
    if (warning) {
      warning.innerHTML = `<p>⚠️ ${message}</p>`;
      DOM.addClass(warning, 'show');
      setTimeout(() => DOM.removeClass(warning, 'show'), 5000);
    } else {
      alert(message);
    }
  }

  removeFile(index) {
    if (index === undefined || index === null) {
      // Удаляем все файлы
      this.currentFiles = [];
    } else {
      // Удаляем файл по индексу
      this.currentFiles.splice(index, 1);
    }

    const fileInput = DOM.getElement('fileAttachment');
    if (fileInput) fileInput.value = '';

    this._renderFileList();
  }

  _initPhoneMask() {
    const phoneInput = DOM.getElement('phone');
    if (phoneInput && window.PhoneFormatter) {
      window.PhoneFormatter.bindToInput(phoneInput);
    }
  }

  _initFormSubmit() {
    const form = DOM.getElement('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }
  }

  _initFloatingButton() {
    const btn = DOM.query('.floating-cta-btn');
    if (btn) {
      btn.addEventListener('click', () => this.openModal());
    }
  }

  openModal() {
    if (!this.rateLimiter.canProceed()) {
      const warning = DOM.getElement('rateLimitWarning');
      if (warning) {
        DOM.addClass(warning, 'show');
        setTimeout(() => DOM.removeClass(warning, 'show'), 5000);
      }
      return;
    }

    const warning = DOM.getElement('rateLimitWarning');
    if (warning) DOM.removeClass(warning, 'show');

    if (typeof modalManager !== 'undefined') {
      modalManager.open('form');
    } else {
      console.error('ModalManager not available');
    }
  }

  _validateForm() {
    const fields = [
      { id: 'companyName', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 2) },
      { id: 'contactPerson', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 2) },
      { id: 'email', validate: (v) => this.validator.required(v) && this.validator.email(v) },
      { id: 'phone', validate: (v) => this.validator.required(v) && this.validator.phone(v) },
      { id: 'aircraftType', validate: (v) => this.validator.required(v) },
      { id: 'serviceType', validate: (v) => this.validator.required(v) },
      { id: 'taskDescription', validate: (v) => this.validator.required(v) && this.validator.minLength(v, 10) }
    ];

    let isValid = true;

    fields.forEach(field => {
      const element = DOM.getElement(field.id);
      const errorEl = DOM.getElement(`${field.id}Error`);
      const value = element?.value?.trim() || '';

      if (!field.validate(value)) {
        if (element) DOM.addClass(element, 'error');
        if (errorEl) DOM.addClass(errorEl, 'show');
        isValid = false;
      } else {
        if (element) DOM.removeClass(element, 'error');
        if (errorEl) DOM.removeClass(errorEl, 'show');
      }
    });

    const honeypot = DOM.getElement('hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }

    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();

    if (!this._validateForm()) return;

    if (!this.rateLimiter.canProceed()) {
      const warning = DOM.getElement('rateLimitWarning');
      if (warning) DOM.addClass(warning, 'show');
      return;
    }

    this.rateLimiter.record();

    const submitBtn = DOM.getElement('submitBtn');
    const originalContent = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div><span>Отправка...</span>';

    try {
      const formData = {
        companyName: DOM.getElement('companyName')?.value.trim() || '',
        contactPerson: DOM.getElement('contactPerson')?.value.trim() || '',
        email: DOM.getElement('email')?.value.trim() || '',
        phone: DOM.getElement('phone')?.value.trim() || '',
        aircraftType: DOM.getElement('aircraftType')?.value || '',
        serviceType: DOM.getElement('serviceType')?.value || '',
        taskDescription: DOM.getElement('taskDescription')?.value.trim() || '',
        files: this.currentFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      // Для реальной отправки файлов нужно использовать FormData
      // const formDataWithFiles = new FormData();
      // Object.keys(formData).forEach(key => formDataWithFiles.append(key, formData[key]));
      // this.currentFiles.forEach(file => formDataWithFiles.append('attachments', file));
      // const result = await this.apiClient.submitFormWithFiles(formDataWithFiles);

      const result = await this.apiClient.submitForm(formData);

      if (result.success) {
        const form = DOM.getElement('proposalForm');
        const successMessage = DOM.getElement('successMessage');

        if (form) form.style.display = 'none';
        if (successMessage) DOM.addClass(successMessage, 'show');

        setTimeout(() => {
          if (typeof modalManager !== 'undefined') {
            modalManager.close('form');
          }
          this._resetForm();
        }, window.CONFIG?.ANIMATION?.MODAL_CLOSE_DELAY_MS || 3000);
      } else {
        this._showError(result.error || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this._showError('Произошла ошибка при отправке. Пожалуйста, попробуйте позже.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  _resetForm() {
    const form = DOM.getElement('proposalForm');
    const successMessage = DOM.getElement('successMessage');
    const fileList = DOM.getElement('fileList');

    if (form) {
      form.reset();
      form.style.display = 'block';
    }

    if (successMessage) DOM.removeClass(successMessage, 'show');

    DOM.queryAll('.form-input, .form-select, .form-textarea').forEach(el => {
      DOM.removeClass(el, 'error');
    });

    DOM.queryAll('.error-message').forEach(el => {
      DOM.removeClass(el, 'show');
    });

    this.currentFiles = [];
    this._renderFileList();
  }
}

window.FormManager = FormManager;