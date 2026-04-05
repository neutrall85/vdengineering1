/**
 * Форматирование телефона
 * ООО "Волга-Днепр Инжиниринг"
 */

class PhoneFormatter {
  static format(input) {
    const clean = this._clean(input);
    if (!clean) return '';
    return this._applyMask(clean);
  }

  static _clean(value) {
    let cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('8')) cleaned = cleaned.slice(1);
    if (cleaned.startsWith('7')) cleaned = cleaned.slice(1);
    return cleaned.slice(0, 10);
  }

  static _applyMask(clean) {
    if (clean.length <= 3) return `+7 (${clean}`;
    if (clean.length <= 6) return `+7 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
    if (clean.length <= 8) return `+7 (${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    return `+7 (${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 10)}`;
  }

  static bindToInput(inputElement) {
    const handler = (e) => {
      const cursorPos = e.target.selectionStart;
      const formatted = this.format(e.target.value);
      e.target.value = formatted;
      if (cursorPos) e.target.setSelectionRange(cursorPos, cursorPos);
    };

    inputElement.addEventListener('input', handler);
    return () => inputElement.removeEventListener('input', handler);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhoneFormatter;
}