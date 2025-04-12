/**
 * Form Component
 * A customizable form that can contain various input components
 *
 * Usage:
 * const myForm = new EZForm(containerElement, options);
 * myForm.render();
 */

class EZForm {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fields: options.fields || [],
      submitButton: options.submitButton || { text: 'Submit' },
      title: options.title || '',
      description: options.description || '',
      ...options
    };
    this.element = null;
    this.elements = {};
    this.fieldComponents = [];

    this.onSubmitCallback = options.onSubmit || null;
    this.onChangeCallback = options.onChange || null;
  }

  render() {
    this.element = document.createElement('form');
    this.element.className = 'ez-form';

    let headerHTML = '';
    if (this.options.title || this.options.description) {
      headerHTML = `
        <div class="ez-form-header">
          ${this.options.title ? `<h3 class="ez-form-title">${this.options.title}</h3>` : ''}
          ${this.options.description ? `<p class="ez-form-description">${this.options.description}</p>` : ''}
        </div>
      `;
    }

    this.element.innerHTML = `
      ${headerHTML}
      <div class="ez-form-fields"></div>
      <div class="ez-form-footer">
        <button type="submit" class="ez-form-submit">
          ${this.options.submitButton.text}
        </button>
      </div>
    `;

    if (!document.getElementById('ez-form-styles')) this._addStyles();

    this.elements = {
      root: this.element,
      fieldsContainer: this.element.querySelector('.ez-form-fields'),
      submitButton: this.element.querySelector('.ez-form-submit'),
      header: this.element.querySelector('.ez-form-header'),
      title: this.element.querySelector('.ez-form-title'),
      description: this.element.querySelector('.ez-form-description'),
      footer: this.element.querySelector('.ez-form-footer')
    };

    this._renderFields();
    this._setupEventListeners();
    this.container.appendChild(this.element);
    return this.element;
  }

  _renderFields() {
    const fieldsContainer = this.elements.fieldsContainer;
    fieldsContainer.innerHTML = '';
    this.fieldComponents = [];

    this.options.fields.forEach((field, index) => {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'ez-form-field';
      fieldContainer.setAttribute('data-field-id', field.id || `field-${index}`);

      if (field.label) {
        const label = document.createElement('label');
        label.className = 'ez-field-label';
        label.innerHTML = field.label;
        if (field.required) label.innerHTML += ' <span class="required">*</span>';
        fieldContainer.appendChild(label);
      }

      if (field.description) {
        const description = document.createElement('div');
        description.className = 'ez-field-description';
        description.innerHTML = field.description;
        fieldContainer.appendChild(description);
      }

      const inputContainer = document.createElement('div');
      inputContainer.className = 'ez-field-input';
      fieldContainer.appendChild(inputContainer);
      fieldsContainer.appendChild(fieldContainer);
      let component;

      switch (field.type) {
        case 'select':
          component = new EZSelectMenu(inputContainer, {
            placeholder: field.placeholder || 'Select an option',
            options: field.options || [],
            value: field.value,
            disabled: field.disabled,
            onChange: (value) => this._handleFieldChange(field.id || `field-${index}`, value)
          });
          break;

        case 'text':
        case 'textarea':
        case 'number':
        case 'email':
        case 'password':
        default:
          const inputType = ['text', 'number', 'email', 'password'].includes(field.type) ? field.type : 'text';
          const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');

          if (field.type !== 'textarea') input.type = inputType;

          input.className = 'ez-input';
          input.placeholder = field.placeholder || '';
          input.value = field.value || '';

          if (field.disabled) input.disabled = true;
          if (field.required) input.required = true;
          if (field.min !== undefined) input.min = field.min;
          if (field.max !== undefined) input.max = field.max;

          input.addEventListener('input', (e) => {
            this._handleFieldChange(field.id || `field-${index}`, e.target.value);
          });

          inputContainer.appendChild(input);
          component = input;
          break;
      }

      if (component) {
        if (typeof component.render === 'function') component.render();

        this.fieldComponents.push({
          id: field.id || `field-${index}`,
          component
        });
      }

      const validationMessage = document.createElement('div');
      validationMessage.className = 'ez-validation-message';
      fieldContainer.appendChild(validationMessage);
    });
  }

  _setupEventListeners() {
    this.element.addEventListener('submit', (e) => {
      e.preventDefault();

      if (this._validateForm()) {
        const formData = this.getValues();

        if (this.onSubmitCallback) this.onSubmitCallback(formData, this);
      }
    });
  }

  _validateForm() {
    let isValid = true;

    this.options.fields.forEach((field, index) => {
      const fieldId = field.id || `field-${index}`;
      const fieldElement = this.element.querySelector(`[data-field-id="${fieldId}"]`);
      const validationMessage = fieldElement?.querySelector('.ez-validation-message');

      if (!validationMessage) return;

      validationMessage.textContent = '';
      validationMessage.style.display = 'none';
      const value = this.getValue(fieldId);

      if (field.required && (value === undefined || value === null || value === '')) {
        validationMessage.textContent = field.requiredMessage || 'This field is required';
        validationMessage.style.display = 'block';
        isValid = false;
      }

      if (field.validate && typeof field.validate === 'function') {
        const customValidation = field.validate(value);
        if (customValidation !== true) {
          validationMessage.textContent = customValidation || 'Invalid value';
          validationMessage.style.display = 'block';
          isValid = false;
        }
      }
    });

    return isValid;
  }

  _handleFieldChange(fieldId, value) {
    this._updateDependentFields(fieldId, value);

    if (this.onChangeCallback) this.onChangeCallback(fieldId, value, this.getValues(), this);
  }

  _updateDependentFields(changedFieldId, value) {
    this.options.fields.forEach((field, index) => {
      if (field.dependsOn && field.dependsOn.field === changedFieldId) {
        const fieldId = field.id || `field-${index}`;
        const componentInfo = this.fieldComponents.find(info => info.id === fieldId);

        if (!componentInfo) return;

        let shouldEnable = false;

        if (field.dependsOn.condition === 'equals') {
          shouldEnable = value === field.dependsOn.value;
        } else if (field.dependsOn.condition === 'notEquals') {
          shouldEnable = value !== field.dependsOn.value;
        } else if (field.dependsOn.condition === 'contains') {
          shouldEnable = String(value).includes(field.dependsOn.value);
        } else if (field.dependsOn.condition === 'notEmpty') {
          shouldEnable = value !== undefined && value !== null && value !== '';
        }

        if (componentInfo.component.enable && componentInfo.component.disable) {
          if (shouldEnable) {
            componentInfo.component.enable();
          } else {
            componentInfo.component.disable();
          }
        } else if ('disabled' in componentInfo.component) {
          componentInfo.component.disabled = !shouldEnable;
        }
      }
    });
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'ez-form-styles';
    style.textContent = `
      .ez-form {
          font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #36393f;
          color: #dcddde;
          padding: 20px;
          border-radius: 5px;
          width: 100%;
          max-width: 600px;
          box-sizing: border-box;
      }

      .ez-form-header {
          margin-bottom: 20px;
      }

      .ez-form-title {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #ffffff;
      }

      .ez-form-description {
          margin: 0;
          font-size: 14px;
          color: #b9bbbe;
      }

      .ez-form-fields {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
      }

      .ez-form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
      }

      .ez-field-label {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
      }

      .ez-field-label .required {
          color: #ed4245;
          margin-left: 3px;
      }

      .ez-field-description {
          font-size: 12px;
          color: #b9bbbe;
          margin-bottom: 5px;
      }

      .ez-field-input {
          width: 100%;
      }

      .ez-input {
          width: 100%;
          background-color: #40444b;
          border: 1px solid #202225;
          border-radius: 3px;
          color: #dcddde;
          padding: 10px;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
      }

      .ez-input:focus {
          border-color: #5865f2;
      }

      textarea.ez-input {
          min-height: 80px;
          resize: vertical;
      }

      .ez-validation-message {
          font-size: 12px;
          color: #ed4245;
          margin-top: 5px;
          display: none;
      }

      .ez-form-footer {
          display: flex;
          justify-content: flex-end;
      }

      .ez-form-submit {
          background-color: #5865f2;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
      }

      .ez-form-submit:hover {
          background-color: #4752c4;
      }

      .ez-form-submit:disabled {
          background-color: #4f545c;
          cursor: not-allowed;
          opacity: 0.7;
      }
    `;

    document.head.appendChild(style);
  }

  getValue(fieldId) {
    const componentInfo = this.fieldComponents.find(info => info.id === fieldId);

    if (!componentInfo) return undefined;

    if (componentInfo.component.getValue) {
      return componentInfo.component.getValue();
    } else if (componentInfo.component.value !== undefined) {
      return componentInfo.component.value;
    }

    return undefined;
  }

  setValue(fieldId, value) {
    const componentInfo = this.fieldComponents.find(info => info.id === fieldId);

    if (!componentInfo) return this;

    if (componentInfo.component.setValue) {
      componentInfo.component.setValue(value);
    } else if ('value' in componentInfo.component) {
      componentInfo.component.value = value;
    }

    this._updateDependentFields(fieldId, value);

    return this;
  }

  getValues() {
    const values = {};

    this.fieldComponents.forEach(info => {
      values[info.id] = this.getValue(info.id);
    });

    return values;
  }

  setValues(valuesObj) {
    for (const fieldId in valuesObj) {
      this.setValue(fieldId, valuesObj[fieldId]);
    }

    return this;
  }

  reset() {
    this.options.fields.forEach((field, index) => {
      const fieldId = field.id || `field-${index}`;
      this.setValue(fieldId, field.value || '');
    });

    const validationMessages = this.element.querySelectorAll('.ez-validation-message');
    validationMessages.forEach(message => {
      message.textContent = '';
      message.style.display = 'none';
    });

    return this;
  }

  disable() {
    this.fieldComponents.forEach(info => {
      if (info.component.disable) {
        info.component.disable();
      } else if ('disabled' in info.component) {
        info.component.disabled = true;
      }
    });

    if (this.elements.submitButton) this.elements.submitButton.disabled = true;

    return this;
  }

  enable() {
    this.fieldComponents.forEach(info => {
      if (info.component.enable) {
        info.component.enable();
      } else if ('disabled' in info.component) {
        info.component.disabled = false;
      }
    });

    if (this.elements.submitButton) this.elements.submitButton.disabled = false;

    this.fieldComponents.forEach(info => {
      const field = this.options.fields.find((f, i) => (f.id || `field-${i}`) === info.id);
      if (field && field.dependsOn) {
        const dependentValue = this.getValue(field.dependsOn.field);
        this._updateDependentFields(field.dependsOn.field, dependentValue);
      }
    });

    return this;
  }

  /**
   * Set a specific CSS style property on a form element
   * @param {string} property - The CSS property name
   * @param {string} value - The CSS property value
   * @param {string} elementName - The element to target (root, fieldsContainer, submitButton, etc) - defaults to root
   * @returns {EZForm} - Returns this for method chaining
   */
  setStyleProperty(property, value, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) {
      targetElement.style[property] = value;
    }
    return this;
  }

  /**
   * Get the current value of a CSS style property
   * @param {string} property - The CSS property name
   * @param {string} elementName - The element to target - defaults to root
   * @returns {string} - The current value of the property
   */
  getStyleProperty(property, elementName = 'root') {
    const targetElement = this.elements[elementName];
    if (targetElement) {
      return getComputedStyle(targetElement)[property];
    }
    return null;
  }

  /**
   * Set multiple style properties at once
   * @param {Object} styles - Object with CSS properties as keys and values
   * @param {string} elementName - The element to target - defaults to root
   * @returns {EZForm} - Returns this for method chaining
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
   * Set style property for a specific field by ID
   * @param {string} fieldId - ID of the field to style
   * @param {string} property - The CSS property name
   * @param {string} value - The CSS property value
   * @returns {EZForm} - Returns this for method chaining
   */
  setFieldStyle(fieldId, property, value) {
    const fieldElement = this.element.querySelector(`[data-field-id="${fieldId}"]`);
    if (fieldElement) {
      fieldElement.style[property] = value;
    }
    return this;
  }

  /**
   * Gets the list of available elements that can be styled
   * @returns {Object} Object containing element names and descriptions
   */
  getElementsList() {
    return {
      root: "The main form container",
      fieldsContainer: "Container of all form fields",
      submitButton: "The submit button",
      header: "The form header section (title + description)",
      title: "The form title",
      description: "The form description",
      footer: "The form footer section"
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZForm;
} else {
  window.EZForm = EZForm;
}
