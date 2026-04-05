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
    this._initFileUpload();
    this._initPhoneMask();
    this._initFormSubmit();
    this._initFloatingButton();
  }

  _initFileUpload() {
    const fileInput = DOMHelper.getElement('fileAttachment');
    const fileDrop = DOMHelper.getElement('fileDrop');
    
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
      alert(validation.error);
      const fileInput = DOMHelper.getElement('fileAttachment');
      if (fileInput) fileInput.value = '';
      return;
    }
    
    this.currentFile = file;
    const fileNameText = DOMHelper.getElement('fileNameText');
    const fileName = DOMHelper.getElement('fileName');
    const fileDrop = DOMHelper.getElement('fileDrop');
    
    if (fileNameText) fileNameText.textContent = file.name;
    if (fileName) DOMHelper.addClass(fileName, 'show');
    if (fileDrop) DOMHelper.addClass(fileDrop, 'has-file');
  }

  removeFile() {
    const fileInput = DOMHelper.getElement('fileAttachment');
    const fileName = DOMHelper.getElement('fileName');
    const fileDrop = DOMHelper.getElement('fileDrop');
    
    this.currentFile = null;
    if (fileInput) fileInput.value = '';
    if (fileName) DOMHelper.removeClass(fileName, 'show');
    if (fileDrop) DOMHelper.removeClass(fileDrop, 'has-file');
  }

  _initPhoneMask() {
    const phoneInput = DOMHelper.getElement('phone');
    if (phoneInput) {
      PhoneFormatter.bindToInput(phoneInput);
    }
  }

  _initFormSubmit() {
    const form = DOMHelper.getElement('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => this._handleSubmit(e));
    }
    
    const removeBtn = DOMHelper.query('#fileName svg');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFile();
      });
    }
  }

  _initFloatingButton() {
    const btn = DOMHelper.query('.floating-cta-btn');
    if (btn) {
      btn.addEventListener('click', () => this.openModal());
    }
  }

  openModal() {
    if (!this.rateLimiter.canProceed()) {
      const warning = DOMHelper.getElement('rateLimitWarning');
      if (warning) DOMHelper.addClass(warning, 'show');
      return;
    }
    
    const warning = DOMHelper.getElement('rateLimitWarning');
    if (warning) DOMHelper.removeClass(warning, 'show');
    
    modalManager.open('form');
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
      const element = DOMHelper.getElement(field.id);
      const errorEl = DOMHelper.getElement(`${field.id}Error`);
      const value = element?.value?.trim() || '';
      
      if (!field.validate(value)) {
        if (element) DOMHelper.addClass(element, 'error');
        if (errorEl) DOMHelper.addClass(errorEl, 'show');
        isValid = false;
      } else {
        if (element) DOMHelper.removeClass(element, 'error');
        if (errorEl) DOMHelper.removeClass(errorEl, 'show');
      }
    });
    
    const honeypot = DOMHelper.getElement('hp_website');
    if (honeypot && honeypot.value) {
      return false;
    }
    
    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    
    if (!this._validateForm()) return;
    
    if (!this.rateLimiter.canProceed()) {
      const warning = DOMHelper.getElement('rateLimitWarning');
      if (warning) DOMHelper.addClass(warning, 'show');
      return;
    }
    
    this.rateLimiter.record();
    
    const submitBtn = DOMHelper.getElement('submitBtn');
    const originalContent = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div><span>Отправка...</span>';
    
    try {
      const formData = {
        companyName: DOMHelper.getElement('companyName')?.value.trim() || '',
        contactPerson: DOMHelper.getElement('contactPerson')?.value.trim() || '',
        email: DOMHelper.getElement('email')?.value.trim() || '',
        phone: DOMHelper.getElement('phone')?.value.trim() || '',
        aircraftType: DOMHelper.getElement('aircraftType')?.value || '',
        serviceType: DOMHelper.getElement('serviceType')?.value || '',
        taskDescription: DOMHelper.getElement('taskDescription')?.value.trim() || ''
      };
      
      const result = await this.apiClient.submitForm(formData);
      
      if (result.success) {
        const form = DOMHelper.getElement('proposalForm');
        const successMessage = DOMHelper.getElement('successMessage');
        
        if (form) form.style.display = 'none';
        if (successMessage) DOMHelper.addClass(successMessage, 'show');
        
        setTimeout(() => {
          modalManager.close('form');
        }, CONFIG.ANIMATION.MODAL_CLOSE_DELAY_MS);
      } else {
        alert(result.error || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Произошла ошибка при отправке');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
    }
  }

  _resetForm() {
    const form = DOMHelper.getElement('proposalForm');
    const successMessage = DOMHelper.getElement('successMessage');
    const fileName = DOMHelper.getElement('fileName');
    
    if (form) {
      form.reset();
      form.style.display = 'block';
    }
    
    if (successMessage) DOMHelper.removeClass(successMessage, 'show');
    if (fileName) DOMHelper.removeClass(fileName, 'show');
    
    DOMHelper.queryAll('.form-input, .form-select, .form-textarea').forEach(el => {
      DOMHelper.removeClass(el, 'error');
    });
    
    DOMHelper.queryAll('.error-message').forEach(el => {
      DOMHelper.removeClass(el, 'show');
    });
    
    const submitBtn = DOMHelper.getElement('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
        <span>Отправить запрос</span>
      `;
    }
    
    this.currentFile = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormManager;
}