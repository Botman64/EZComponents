class EZNavbar {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      orientation: options.orientation || 'horizontal',
      items: options.items || [],
      siteIcon: options.siteIcon || '',
      siteIconUrl: options.siteIconUrl || '#',
      visible: options.visible || false,
      onActive: options.onActive || null,
      onInactive: options.onInactive || null,
      ...options
    };
    this.element = null;
    this.elements = {};
  }

  render() {
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }

    this.element = document.createElement('nav');
    this.element.className = `EZnavbar EZnavbar-${this.options.orientation}`;

    if (!this.options.visible) this.element.style.display = 'none';

    if (this.options.siteIcon) {
      const siteIconLink = document.createElement('a');
      siteIconLink.href = this.options.siteIconUrl;
      siteIconLink.className = 'EZnavbar-site-icon';
      siteIconLink.innerHTML = this._renderIcon(this.options.siteIcon);
      this.element.appendChild(siteIconLink);
      this.elements.siteIcon = siteIconLink;
    }

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'EZnavbar-items';
    this.options.items.forEach(item => {
      const navItem = document.createElement('a');
      navItem.className = `EZnavbar-item ${item.active ? 'EZnavbar-item-active' : ''}`;
      navItem.href = item.url || '#';
      navItem.innerHTML = `
        ${item.icon ? `<span class="EZnavbar-icon">${this._renderIcon(item.icon)}</span>` : ''}
        <span class="EZnavbar-text">${item.text}</span>
      `;
      navItem.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.onClick) item.onClick(item, this);
      });
      itemsContainer.appendChild(navItem);
    });

    this.element.appendChild(itemsContainer);
    this.elements.itemsContainer = itemsContainer;

    if (!document.getElementById('EZnavbar-styles')) this._addStyles();

    this.container.appendChild(this.element);

    if (this.options.visible && this.options.onActive) this.options.onActive(this);

    return this.element;
  }

  setVisible(visible) {
    const wasVisible = this.options.visible;
    this.options.visible = visible;

    if (this.element) {
      this.element.style.display = visible ? 'flex' : 'none';

      if (visible && !wasVisible && this.options.onActive) {
        this.options.onActive(this);
      } else if (!visible && wasVisible && this.options.onInactive) {
        this.options.onInactive(this);
      }
    }
  }

  /**
   * Render an icon based on its type (Unicode, Font Awesome, favicon, or image URL)
   * @param {string} icon - The icon value
   * @returns {string} - The HTML string for the icon
   */
  _renderIcon(icon) {
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.gif')) {
      return `<img src="${icon}" alt="icon" class="EZnavbar-icon-image">`;
    } else if (icon.startsWith('fa-')) {
      return `<i class="${icon}"></i>`;
    } else {
      return icon;
    }
  }

  _getElementByName(elementName) {
    if (elementName === 'root') return this.element;
    return this.elements[elementName] || null;
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'EZnavbar-styles';
    style.textContent = `
      body{
        padding-top: 50px;
        padding-left: 50px;
        padding-right: 50px;
      }
      .EZnavbar {
          display: flex;
          align-items: center;
          background-color: #1c1e21;
          color: white;
          font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }

      .EZnavbar-horizontal {
          flex-direction: row;
          position: fixed;
          top: 0;
          left: 0;
          justify-content: space-between;
          width: 100%;
          padding: 0 20px;
      }

      .EZnavbar-vertical {
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          min-width: 200px;
          padding: 20px 0;
      }

      .EZnavbar-site-icon {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
      }

      .EZnavbar-horizontal .EZnavbar-site-icon {
          margin-top: 10px;
          margin-bottom: 10px;
          margin-right: auto;
      }

      .EZnavbar-horizontal .EZnavbar-items {
        margin:auto;
        margin-bottom:0;
        width:100%;
      }

      .EZnavbar-items {
          display: flex;
          flex-direction: inherit;
          justify-content: center;
          gap: 1px;
      }

      .EZnavbar-item {
          min-width: 200px;
          display: flex;
          align-items: center;
          padding: 10px 16px;
          text-decoration: none;
          color: white;
          transition: background-color 0.2s ease;
      }

      .EZnavbar-item:hover {
          background-color: #2c2f33;
      }

      .EZnavbar-item-active {
          background-color: #5865F2;
          border-radius: 4px;
      }

      .EZnavbar-horizontal .EZnavbar-item-active {
          border-radius: 4px 4px 0 0;
      }
      .EZnavbar-vertical .EZnavbar-item-active {
          border-radius: 4px 0 0 4px;
      }

      .EZnavbar-icon {
          margin-right: 8px;
          font-size: 16px;
      }

      .EZnavbar-icon-image {
          width: 16px;
          height: 16px;
          object-fit: cover;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set a specific CSS style property on a navbar element
   * @param {string} property - The CSS property name
   * @param {string} value - The CSS property value
   * @param {string} elementName - The element to target (root, itemsContainer, siteIcon) - defaults to root
   * @returns {EZNavbar} - Returns this for method chaining
   */
  setStyleProperty(property, value, elementName = 'root') {
    const targetElement = this._getElementByName(elementName);
    if (targetElement) targetElement.style[property] = value;
    return this;
  }

  /**
   * Get the current value of a CSS style property
   * @param {string} property - The CSS property name
   * @param {string} elementName - The element to target - defaults to root
   * @returns {string} - The current value of the property
   */
  getStyleProperty(property, elementName = 'root') {
    const targetElement = this._getElementByName(elementName);
    if (targetElement) return getComputedStyle(targetElement)[property];
    return null;
  }

  /**
   * Set multiple style properties at once
   * @param {Object} styles - Object with CSS properties as keys and values
   * @param {string} elementName - The element to target - defaults to root
   * @returns {EZNavbar} - Returns this for method chaining
   */
  setStyleProperties(styles, elementName = 'root') {
    const targetElement = this._getElementByName(elementName);
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
      root: "The main navbar container",
      itemsContainer: "Container of all navbar items",
      siteIcon: "The site icon/logo element"
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZNavbar;
} else {
  window.EZNavbar = EZNavbar;
}
