/**
 * Select Menu Component
 * A customizable dropdown select menu with rich options
 *
 * Usage:
 * const myMenu = new EZSelectMenu(containerElement, options);
 * myMenu.render();
 */

class EZSelectMenu {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      placeholder: options.placeholder || 'Select an option',
      options: options.options || [],
      disabled: options.disabled || false,
      value: options.value || null,
      maxValues: options.maxValues || 1,
      minValues: options.minValues || 0,
      ...options
    };
    this.element = null;
    this.elements = {};
    this.isOpen = false;

    this.onChangeCallback = options.onChange || null;
    this.onOpenCallback = options.onOpen || null;
    this.onCloseCallback = options.onClose || null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'ez-select-menu';

    if (this.options.disabled) this.element.classList.add('ez-select-disabled');

    const selectedOption = this._getSelectedOption();
    let selectButtonHTML = `
          <div class="ez-select-button">
            ${selectedOption ? this._renderOptionContent(selectedOption) : `<div class="ez-select-placeholder">${this.options.placeholder}</div>`}
            <div class="ez-select-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
              </svg>
            </div>
          </div>
        `;

    let dropdownHTML = `
          <div class="ez-select-dropdown" style="display: none;">
            ${this.options.options.map(option => `
              <div class="ez-select-option" data-value="${option.value}">
                ${this._renderOptionContent(option)}
              </div>
            `).join('')}
          </div>
        `;

    this.element.innerHTML = selectButtonHTML + dropdownHTML;
    this.elements = {
      root: this.element,
      button: this.element.querySelector('.ez-select-button'),
      dropdown: this.element.querySelector('.ez-select-dropdown'),
      placeholder: this.element.querySelector('.ez-select-placeholder'),
      arrow: this.element.querySelector('.ez-select-arrow'),
      options: this.element.querySelectorAll('.ez-select-option')
    };

    if (!document.getElementById('ez-select-styles')) this._addStyles();

    this._setupEventListeners();
    this.container.appendChild(this.element);
    return this.element;
  }

  _renderOptionContent(option) {
    let html = '<div class="ez-select-option-content">';

    if (option.emoji) html += `<div class="ez-select-option-emoji">${option.emoji}</div>`;

    html += '<div class="ez-select-option-text">';
    html += `<div class="ez-select-option-title">${option.label || option.title || option.value}</div>`;

    if (option.description) html += `<div class="ez-select-option-description">${option.description}</div>`;

    html += '</div>';
    html += '</div>';
    return html;
  }

  _getSelectedOption() {
    if (!this.options.value) return null;
    return this.options.options.find(option => option.value === this.options.value);
  }

  _setupEventListeners() {
    if (this.options.disabled) return;

    this.elements.button.addEventListener('click', () => {
      this.toggle();
    });

    this.elements.options.forEach(optionElement => {
      optionElement.addEventListener('click', () => {
        const value = optionElement.getAttribute('data-value');
        this.setValue(value);
        this.close();
      });
    });

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target)) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.close();
    });
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'ez-select-styles';
    style.textContent = `
          .ez-select-menu {
              position: absolute;
              width: 100%;
              max-width: 300px;
              font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #dcddde;
          }

          .ez-select-button {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background-color: #2f3136;
              border: 1px solid #202225;
              border-radius: 4px;
              padding: 10px;
              cursor: pointer;
              user-select: none;
              transition: border-color 0.2s;
          }

          .ez-select-button:hover {
              border-color: #5865f2;
          }

          .ez-select-placeholder {
              color: #72767d;
          }

          .ez-select-arrow {
              color: #72767d;
              display: flex;
              align-items: center;
              transition: transform 0.2s;
          }

          .ez-select-menu.open .ez-select-arrow {
              transform: rotate(180deg);
          }

          .ez-select-dropdown {
              position: absolute;
              top: 100%;
              left: 0;
              width: 100%;
              background-color: #36393f;
              border: 1px solid #202225;
              border-radius: 4px;
              margin-top: 4px;
              z-index: 1000;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          .ez-select-option {
              padding: 10px;
              cursor: pointer;
              transition: background-color 0.1s;
          }

          .ez-select-option:hover {
              background-color: #4f545c;
          }

          .ez-select-option-content {
              display: flex;
              align-items: center;
              gap: 10px;
          }

          .ez-select-option-emoji {
              font-size: 20px;
              min-width: 24px;
              text-align: center;
          }

          .ez-select-option-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
          }

          .ez-select-option-title {
              font-size: 14px;
              font-weight: 500;
              color: #ffffff;
          }

          .ez-select-option-description {
              font-size: 12px;
              color: #a3a6aa;
          }

          .ez-select-disabled {
              opacity: 0.5;
              pointer-events: none;
          }
        `;

    document.head.appendChild(style);
  }

  setValue(value) {
    const prevValue = this.options.value;
    this.options.value = value;

    const selectedOption = this._getSelectedOption();
    const buttonContent = selectedOption
      ? this._renderOptionContent(selectedOption)
      : `<div class="ez-select-placeholder">${this.options.placeholder}</div>`;

    this.elements.button.innerHTML = buttonContent + `
          <div class="ez-select-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
            </svg>
          </div>
        `;

    if (this.onChangeCallback && prevValue !== value) this.onChangeCallback(value, this);

    return this;
  }

  getValue() {
    return this.options.value;
  }

  open() {
    if (!this.isOpen && !this.options.disabled) {
      this.isOpen = true;
      this.element.classList.add('open');
      this.elements.dropdown.style.display = 'block';

      if (this.onOpenCallback) this.onOpenCallback(this);
    }
    return this;
  }

  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.element.classList.remove('open');
      this.elements.dropdown.style.display = 'none';

      if (this.onCloseCallback) this.onCloseCallback(this);
    }
    return this;
  }

  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  setOptions(newOptions) {
    this.options.options = newOptions;

    if (this.element) {
      this.element.remove();
      this.render();
    }

    return this;
  }

  disable() {
    this.options.disabled = true;
    if (this.element) this.element.classList.add('ez-select-disabled');
    return this;
  }

  enable() {
    this.options.disabled = false;
    if (this.element) this.element.classList.remove('ez-select-disabled');
    return this;
  }

  /**
   * Set a specific CSS style property on a select menu element
   * @param {string} property - The CSS property name
   * @param {string} value - The CSS property value
   * @param {string} elementName - The element to target (root, button, dropdown, placeholder, arrow) - defaults to root
   * @returns {EZSelectMenu} - Returns this for method chaining
   */
  setStyleProperty(property, value, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) targetElement.style[property] = value;
    return this;
  }

  /**
   * Get the current value of a CSS style property
   * @param {string} property - The CSS property name
   * @param {string} elementName - The element to target (root, button, dropdown, placeholder, arrow) - defaults to root
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
   * @param {string} elementName - The element to target (root, button, dropdown, placeholder, arrow) - defaults to root
   * @returns {EZSelectMenu} - Returns this for method chaining
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

  /**
   * Gets the list of available elements that can be styled
   * @returns {Object} Object containing element names and descriptions
   */
  getElementsList() {
    return {
      root: "The main select menu container",
      button: "The button that opens the dropdown",
      dropdown: "The dropdown menu containing options",
      placeholder: "The placeholder text (when no option is selected)",
      arrow: "The dropdown arrow icon",
      options: "All option elements (styling applied to all options)"
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZSelectMenu;
} else {
  window.EZSelectMenu = EZSelectMenu;
}
