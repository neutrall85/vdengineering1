/**
 * Управление формой
 * ООО "Волга-Днепр Инжиниринг"
 */

class FormManager {
  constructor(apiClient, rateLimiter, validator) {
    this.apiClient = apiClient;
    this.rateLimiter = rateLimiter;
    this.validator = validator;
    this.currentFile = null;
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
    
    const file = files[0];
    const validation = this.validator.file(file);
    
    if (!validation.valid) {
      this._showError(validation.error);
      const fileInput = DOM.getElement('fileAttachment');
      if (fileInput) fileInput.value = '';
      return;
    }
    
    this.currentFile = file;
    const fileNameText = DOM.getElement('fileNameText');
    const fileName = DOM.getElement('fileName');
    const fileDrop = DOM.getElement('fileDrop');
    
    if (fileNameText) fileNameText.textContent = file.name;
    if (fileName) DOM.addClass(fileName, 'show');
    if (fileDrop) DOM.addClass(fileDrop, 'has-file');
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

  removeFile() {
    const fileInput = DOM.getElement('fileAttachment');
    const fileName = DOM.getElement('fileName');
    const fileDrop = DOM.getElement('fileDrop');
    
    this.currentFile = null;
    if (fileInput) fileInput.value = '';
    if (fileName) DOM.removeClass(fileName, 'show');
    if (fileDrop) DOM.removeClass(fileDrop, 'has-file');
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
    
    const removeBtn = DOM.query('#fileName svg');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFile();
      });
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
        taskDescription: DOM.getElement('taskDescription')?.value.trim() || ''
      };
      
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
    const fileName = DOM.getElement('fileName');
    
    if (form) {
      form.reset();
      form.style.display = 'block';
    }
    
    if (successMessage) DOM.removeClass(successMessage, 'show');
    if (fileName) DOM.removeClass(fileName, 'show');
    
    DOM.queryAll('.form-input, .form-select, .form-textarea').forEach(el => {
      DOM.removeClass(el, 'error');
    });
    
    DOM.queryAll('.error-message').forEach(el => {
      DOM.removeClass(el, 'show');
    });
    
    this.currentFile = null;
  }
}

window.FormManager = FormManager;