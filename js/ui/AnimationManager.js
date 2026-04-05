/**
 * Управление анимациями
 * ООО "Волга-Днепр Инжиниринг"
 */

class AnimationManager {
  constructor() {
    this.observers = [];
    this.counterObserver = null;
    this.fadeObserver = null;
  }

  init() {
    this._initFadeInObserver();
    this._initCounters();
  }

  _initFadeInObserver() {
    const options = {
      threshold: CONFIG.ANIMATION.OBSERVER_THRESHOLD,
      rootMargin: CONFIG.ANIMATION.ROOT_MARGIN
    };

    this.fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          DOMHelper.addClass(entry.target, 'visible');
          this.fadeObserver.unobserve(entry.target);
        }
      });
    }, options);

    DOMHelper.queryAll('.fade-in').forEach(el => {
      this.fadeObserver.observe(el);
    });
    
    this.observers.push(this.fadeObserver);
  }

  _initCounters() {
    const counters = DOMHelper.queryAll('.stat-number');
    if (counters.length === 0) return;

    this.counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this._animateCounter(entry.target);
          this.counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => this.counterObserver.observe(counter));
    this.observers.push(this.counterObserver);
  }

  _animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'), 10);
    if (!target || isNaN(target)) return;

    let current = 0;
    const step = target / CONFIG.ANIMATION.COUNTER_STEPS;
    
    const update = () => {
      current += step;
      if (current < target) {
        element.textContent = Math.floor(current) + '+';
        requestAnimationFrame(update);
      } else {
        element.textContent = target + '+';
      }
    };
    
    update();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

const animationManager = new AnimationManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationManager, animationManager };
}