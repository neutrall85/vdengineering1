/**
 * UniversalApplicationModalManager - менеджер универсального модального окна заявок
 * Отвечает за открытие/закрытие и валидацию формы отклика на вакансии
 * ООО "Волга-Днепр Инжиниринг"
 */

const UniversalApplicationModalManager = {
    formValidator: null,

    /**
     * Инициализация универсального модального окна
     */
    init() {
        this._setupGlobalFunctions();
        this._setupFormValidation();
        this._setupPhoneInput();
        this._setupFileUpload();
    },

    /**
     * Настройка глобальных функций открытия/закрытия модального окна
     */
    _setupGlobalFunctions() {
        window.openApplicationModal = (triggerElement) => {
            const overlay = document.getElementById('universalApplicationModalOverlay');
            if (!overlay) return;

            let mode = 'vacancy';
            const vacancyId = triggerElement ? triggerElement.getAttribute('data-vacancy-id') : null;
            if (!vacancyId) mode = 'application';

            const modalTitle = document.getElementById('universalApplicationModalTitle');
            const submitBtnText = document.getElementById('universalSubmitBtnText');
            const successTitle = document.getElementById('universalSuccessTitle');
            
            if (mode === 'application') {
                if (modalTitle) modalTitle.textContent = 'Отправить заявку';
                if (submitBtnText) submitBtnText.textContent = 'Отправить информацию';
                if (successTitle) successTitle.textContent = 'Данные отправлены!';
            } else {
                if (modalTitle) modalTitle.textContent = 'Отклик на вакансию';
                if (submitBtnText) submitBtnText.textContent = 'Отправить отклик';
                if (successTitle) successTitle.textContent = 'Отклик отправлен!';
            }

            // Открываем через ModalManager
            if (typeof modalManager !== 'undefined') {
                modalManager.open('universal');
            } else {
                Logger.WARN('ModalManager not available for universal application modal');
            }
        };

        window.closeUniversalApplicationModal = () => {
            if (typeof modalManager !== 'undefined') {
                modalManager.close('universal');
            } else {
                Logger.WARN('ModalManager not available for universal application modal close');
            }
        };
    },

    /**
     * Настройка валидации формы через FormValidation
     */
    _setupFormValidation() {
        const universalForm = document.getElementById('universalApplicationForm');
        
        if (universalForm && typeof FormValidation !== 'undefined') {
            this.formValidator = FormValidation.createValidator(universalForm, {
                validateOnInput: true,
                messages: {
                    required: 'Это поле обязательно для заполнения',
                    email: 'Введите корректный email адрес',
                    phone: 'Введите корректный номер телефона',
                    minLength: (min) => `Минимальная длина — ${min} символов`,
                    consent: 'Необходимо согласие на обработку данных',
                    fileRequired: 'Пожалуйста, прикрепите резюме'
                }
            });

            // Обработчик успешной валидации
            universalForm.addEventListener('form:valid', (e) => {
                Logger.INFO('Форма валидна, отправка заявки...');
                this._handleFormSuccess();
            });
        }
    },

    /**
     * Обработка успешной отправки формы
     */
    _handleFormSuccess() {
        const successMessage = document.getElementById('universalSuccessMessage');
        const form = document.getElementById('universalApplicationForm');
        
        if (successMessage && form) {
            form.classList.add('hidden-form');
            successMessage.classList.add('show');
            
            setTimeout(() => {
                window.closeUniversalApplicationModal();
                form.reset();
                form.classList.remove('hidden-form');
                successMessage.classList.remove('show');
                
                if (typeof formManager !== 'undefined') {
                    formManager.currentFiles = [];
                    const fileList = document.getElementById('universalFileList');
                    if (fileList) {
                        // Очищаем через DOM API вместо innerHTML
                        while (fileList.firstChild) {
                            fileList.removeChild(fileList.firstChild);
                        }
                    }
                    const fileText = document.querySelector('#universalFileDrop .form-file-text');
                    if (fileText) fileText.textContent = 'Выбрать файл...';
                }
                
                // Сброс валидатора
                if (this.formValidator) this.formValidator.reset();
            }, 3000);
        }
    },

    /**
     * Настройка автопрефикса для поля телефона
     */
    _setupPhoneInput() {
        const phoneInput = document.getElementById('universalPhone');
        if (phoneInput && Utils.PhoneUtils) {
            Utils.PhoneUtils.setupAutoPrefix(phoneInput);
        }
    },

    /**
     * Инициализация загрузки файлов
     */
    _setupFileUpload() {
        if (typeof formManager !== 'undefined') {
            setTimeout(() => {
                const universalFileDrop = document.getElementById('universalFileDrop');
                if (universalFileDrop) {
                    formManager._initFileUpload(document.getElementById('universalApplicationModalOverlay'));
                }
            }, 150);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalApplicationModalManager;
}
