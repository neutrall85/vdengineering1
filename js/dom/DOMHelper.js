/**
 * DOM утилиты
 * ООО "Волга-Днепр Инжиниринг"
 */

class DOMHelper {
  static getElement(id) {
    const element = document.getElementById(id);
    if (!element && CONFIG.DEBUG) {
      console.warn(`Element with id "${id}" not found`);
    }
    return element;
  }

  static query(selector, context = document) {
    return context.querySelector(selector);
  }

  static queryAll(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  static trapFocus(element) {
    const focusable = this.queryAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      element
    );
    
    if (focusable.length === 0) return null;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handler = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    element.addEventListener('keydown', handler);
    return () => element.removeEventListener('keydown', handler);
  }

  static toggleBodyScroll(disable) {
    document.body.style.overflow = disable ? 'hidden' : '';
  }

  static setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });
  }

  static addClass(element, ...classes) {
    classes.forEach(cls => {
      if (cls) element.classList.add(cls);
    });
  }

  static removeClass(element, ...classes) {
    classes.forEach(cls => {
      if (cls) element.classList.remove(cls);
    });
  }

  static hasClass(element, className) {
    return element.classList.contains(className);
  }

  static toggleClass(element, className, force) {
    if (force !== undefined) {
      element.classList.toggle(className, force);
    } else {
      element.classList.toggle(className);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMHelper;
}