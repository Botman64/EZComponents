/**
 * Button Component
 * A modular component that creates customizable buttons
 *
 * Usage:
 * const myButton = new EZButton(containerElement, options);
 * myButton.render();
 */

class EZButton {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      text: options.text || 'Button',
      style: options.style || 'primary',
      emoji: options.emoji || '',
      url: options.url || '',
      disabled: options.disabled || false,
      active: options.active || false,
      ...options
    };
    this.element = null;
    this.elements = {};

    this.onClickCallback = options.onClick || null;
    this.onHoverCallback = options.onHover || null;
    this.onActiveCallback = options.onActive || null;
    this.onInactiveCallback = options.onInactive || null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'EZbtn';
    this.element.classList.add(`EZbtn-${this.options.style}`);

    if (this.options.disabled) this.element.classList.add('EZbtn-disabled');
    if (this.options.active) this.element.classList.add('EZbtn-active');

    let buttonHTML = '';
    if (this.options.emoji) buttonHTML += `<span class="EZbtn-emoji">${this.options.emoji}</span>`;

    buttonHTML += `<span class="EZbtn-text">${this.options.text}</span>`;

    this.element.innerHTML = buttonHTML;
    this.elements = {
      root: this.element,
      text: this.element.querySelector('.EZbtn-text'),
      emoji: this.element.querySelector('.EZbtn-emoji')
    };

    if (!document.getElementById('EZbtn-styles')) this._addStyles();

    this._setupEventListeners();
    this.container.appendChild(this.element);
    return this.element;
  }

  _setupEventListeners() {
    if (this.options.disabled) return;

    this.element.addEventListener('click', (e) => {
      if (this.options.url) window.open(this.options.url, '_blank');
      if (this.onClickCallback) this.onClickCallback(e, this);
    });

    if (this.onHoverCallback) {
      this.element.addEventListener('mouseenter', (e) => {
        this.onHoverCallback(true, e, this);
      });

      this.element.addEventListener('mouseleave', (e) => {
        this.onHoverCallback(false, e, this);
      });
    }
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'EZbtn-styles';
    style.textContent = `
      .EZbtn {
          display: inline-flex;
          align-items: center;
          padding: 10px 16px;
          border-radius: 3px;
          font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 16px;
          cursor: pointer;
          transition: background-color 0.17s ease, color 0.17s ease;
          margin: 4px;
          gap: 8px;
          user-select: none;
      }

      .EZbtn-primary {
          background-color: #5865F2;
          color: white;
      }

      .EZbtn-primary:hover {
          background-color: #4752C4;
      }

      .EZbtn-secondary {
          background-color: #4F545C;
          color: white;
      }

      .EZbtn-secondary:hover {
          background-color: #686D73;
      }

      .EZbtn-success {
          background-color: #57F287;
          color: white;
      }

      .EZbtn-success:hover {
          background-color: #45C46C;
      }

      .EZbtn-danger {
          background-color: #ED4245;
          color: white;
      }

      .EZbtn-danger:hover {
          background-color: #D83C3E;
      }

      .EZbtn-link {
          background-color: transparent;
          color: white;
          text-decoration: underline;
          padding: 10px 8px;
      }

      .EZbtn-link:hover {
          text-decoration: none;
      }

      .EZbtn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
      }

      .EZbtn-active {
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3);
      }

      .EZbtn-emoji {
          font-size: 18px;
          line-height: 1;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Set a specific CSS style property on a button element
   * @param {string} property - The CSS property name
   * @param {string} value - The CSS property value
   * @param {string} elementName - The element to target (root, text, emoji) - defaults to root
   * @returns {EZButton} - Returns this for method chaining
   */
  setStyleProperty(property, value, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) targetElement.style[property] = value;
    return this;
  }

  /**
   * Get the current value of a CSS style property
   * @param {string} property - The CSS property name
   * @param {string} elementName - The element to target (root, text, emoji) - defaults to root
   * @returns {string} - The current value of the property
   */
  getStyleProperty(property, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) return getComputedStyle(targetElement)[property];
    return null;
  }

  /**
   * Set multiple style properties at once
   * @param {Object} styles - Object with CSS properties as keys and values
   * @param {string} elementName - The element to target (root, text, emoji) - defaults to root
   * @returns {EZButton} - Returns this for method chaining
   */
  setStyleProperties(styles, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) {
      for (const property in styles) {
        targetElement.style[property] = styles[property];
      }
    }
    return this;
  }


  setActive(active) {
    this.options.active = active;

    if (this.element) {
      if (active) {
        this.element.classList.add('EZbtn-active');
        if (this.onActiveCallback) this.onActiveCallback(this);
      } else {
        this.element.classList.remove('EZbtn-active');
        if (this.onInactiveCallback) this.onInactiveCallback(this);
      }
    }
    return this;
  }

  update(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (this.element) {

      this.element.remove();
      this.render();
    }
    return this;
  }

  setText(text) {
    this.options.text = text;
    if (this.elements.text) this.elements.text.textContent = text;
    return this;
  }

  setEmoji(emoji) {
    this.options.emoji = emoji;
    if (this.element) {
      let emojiElement = this.elements.emoji;

      if (!emoji && emojiElement) {
        emojiElement.remove();
        this.elements.emoji = null;
      }

      else if (emoji) {
        if (emojiElement) {
          emojiElement.textContent = emoji;
        } else {
          emojiElement = document.createElement('span');
          emojiElement.className = 'EZbtn-emoji';
          emojiElement.textContent = emoji;
          this.elements.emoji = emojiElement;
          const textElement = this.elements.text;
          this.element.insertBefore(emojiElement, textElement);
        }
      }
    }
    return this;
  }

  setButtonStyle(style) {
    if (this.element) {
      this.element.classList.remove(`EZbtn-${this.options.style}`);
      this.element.classList.add(`EZbtn-${style}`);
    }
    this.options.style = style;
    return this;
  }

  setDisabled(disabled) {
    this.options.disabled = disabled;
    if (this.element) {
      if (disabled) {
        this.element.classList.add('EZbtn-disabled');
      } else {
        this.element.classList.remove('EZbtn-disabled');
      }
    }
    return this;
  }


  toJSON() {
    return {
      text: this.options.text,
      style: this.options.style,
      emoji: this.options.emoji || undefined,
      url: this.options.url || undefined,
      disabled: this.options.disabled || undefined,
      active: this.options.active || undefined
    };
  }

  /**
   * Gets the list of available elements that can be styled
   * @returns {Object} Object containing element names and descriptions
   */
  getElementsList() {
    return {
      root: "The main button container",
      text: "The text content of the button",
      emoji: "The emoji element (if present)"
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZButton;
} else {
  window.EZButton = EZButton;
}
