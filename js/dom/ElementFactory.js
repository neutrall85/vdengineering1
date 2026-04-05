/**
 * Фабрика DOM элементов
 * ООО "Волга-Днепр Инжиниринг"
 */

class ElementFactory {
  static createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key === 'on' && typeof value === 'object') {
        Object.entries(value).forEach(([event, handler]) => {
          element.addEventListener(event, handler);
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });

    return element;
  }

  static createSVG(path, width = 24, height = 24, className = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    if (className) svg.classList.add(className);
    
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    svg.appendChild(pathElement);
    
    return svg;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElementFactory;
}