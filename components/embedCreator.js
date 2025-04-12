/**
 * Discord-like Embed Creator
 * An interactive component for creating and editing Discord-style embeds
 *
 * Usage:
 * const creator = new EZEmbedCreator(containerElement, options);
 * creator.init();
 * creator.on('update', (data) => {
 *    console.log('Embed updated:', data);
 * });
 */

class EZEmbedCreator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialData: options.initialData || {},
      colorPresets: options.colorPresets || [
        '#5865F2', '#ED4245', '#FEE75C',
        '#57F287', '#EB459E', '#7289DA'
      ],
      ...options
    };

    this.elements = {};
    this.eventHandlers = {
      update: []
    };

    this.currentData = {
      title: 'Title',
      description: 'Description',
      color: '#5865F2',
      author: { name: 'Author Name', iconUrl: '' },
      thumbnail: '',
      image: '',
      fields: [],
      footer: { text: 'Footer Text', timestamp: false }
    };

    if (options.initialData) this.currentData = { ...this.currentData, ...options.initialData };

    this.originalData = JSON.parse(JSON.stringify(this.currentData));
    this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));
  }

  init() {
    this._createDOM();
    this._setupEventListeners();
    return this;
  }


  on(event, callback) {
    if (this.eventHandlers[event]) this.eventHandlers[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event]
        .filter(cb => cb !== callback);
    }
    return this;
  }

  trigger(event, data) {
    if (this.eventHandlers[event]) this.eventHandlers[event].forEach(callback => callback(data));
    return this;
  }

  _createDOM() {

    this.container.innerHTML = '';


    const embedPreview = document.createElement('div');
    embedPreview.className = 'embed-preview';
    embedPreview.id = 'embed-preview';

    embedPreview.innerHTML = `
      <div class="left-border" id="embed-color-bar"></div>
      <div class="thumbnail" id="thumbnail">+ Thumbnail</div>
      <div class="embed-content">
        <div class="author-section">
            <div class="author-icon" id="author-icon">+</div>
            <div id="author-name" contenteditable="true" class="author-name">${this.currentData.author.name}</div>
        </div>
        <div id="preview-title" contenteditable="true" class="embed-title">${this.currentData.title}</div>
        <div id="preview-description" contenteditable="true" class="embed-description">${this.currentData.description}</div>
        <div class="fields-container" id="fields-container">
            <div class="add-field-placeholder" id="add-field-placeholder">+ Add Field</div>
            <div class="add-full-width-placeholder" id="add-full-width-placeholder">+ Add Full-Width Field</div>
        </div>
        <div class="image-panel" id="image-panel">+ Add Image</div>
        <div id="preview-footer" class="embed-footer">
            <div contenteditable="true" id="footer-text" class="footer-text">${this.currentData.footer.text}</div>
            <label class="timestamp-label">
                <input type="checkbox" id="timestamp-checkbox" ${this.currentData.footer.timestamp ? 'checked' : ''}> Include Timestamp
            </label>
        </div>
      </div>
    `;

    this.container.appendChild(embedPreview);


    const colorPickerModal = document.createElement('div');
    colorPickerModal.id = 'color-picker-modal';
    colorPickerModal.className = 'color-picker-modal';
    colorPickerModal.style.display = 'none';

    colorPickerModal.innerHTML = `
      <div class="color-picker-header">
          <h3>Select Embed Color</h3>
          <button id="close-color-picker" class="close-button">✕</button>
      </div>
      <div id="color-picker-content" class="color-picker-content">
          <input type="color" id="embed-color-picker" value="${this.currentData.color}">
          <div class="color-presets">
              ${this.options.colorPresets.map(color => `<div class="color-preset" style="background-color: ${color};" data-color="${color}"></div>`).join('')}
          </div>
      </div>
    `;

    this.container.appendChild(colorPickerModal);


    this._populateFields();


    this.elements = {
      preview: document.getElementById('embed-preview'),
      previewTitle: document.getElementById('preview-title'),
      previewDescription: document.getElementById('preview-description'),
      authorName: document.getElementById('author-name'),
      footerText: document.getElementById('footer-text'),
      embedColorBar: document.getElementById('embed-color-bar'),
      embedColorPicker: document.getElementById('embed-color-picker'),
      timestampCheckbox: document.getElementById('timestamp-checkbox'),
      fieldsContainer: document.getElementById('fields-container'),
      addFieldPlaceholder: document.getElementById('add-field-placeholder'),
      addFullWidthPlaceholder: document.getElementById('add-full-width-placeholder'),
      thumbnail: document.getElementById('thumbnail'),
      imagePanel: document.getElementById('image-panel'),
      authorIcon: document.getElementById('author-icon'),
      colorPickerModal: document.getElementById('color-picker-modal'),
      closeColorPicker: document.getElementById('close-color-picker')
    };


    if (!document.getElementById('embed-creator-styles')) this._addStyles();

    this._updateEmbedColor(this.currentData.color);
    this._loadInitialImages();
  }

  _loadInitialImages() {
    if (this.currentData.thumbnail) this.elements.thumbnail.innerHTML = `<img src="${this.currentData.thumbnail}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
    if (this.currentData.image) this.elements.imagePanel.innerHTML = `<img src="${this.currentData.image}" style="max-width:100%; max-height:300px; border-radius:4px;">`;
    if (this.currentData.author && this.currentData.author.iconUrl) this.elements.authorIcon.innerHTML = `<img src="${this.currentData.author.iconUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
  }

  _populateFields() {
    if (!this.currentData.fields || !this.currentData.fields.length) return;

    const fieldsContainer = document.getElementById('fields-container');
    const addFieldPlaceholder = document.getElementById('add-field-placeholder');

    this.currentData.fields.forEach(field => {
      const fieldElem = document.createElement('div');
      fieldElem.className = `embed-field${field.inline === false ? ' full-width' : ''}`;
      fieldElem.innerHTML = `
          <div contenteditable="true" class="field-name">${field.name}</div>
          <button class="remove-field-button">✕</button>
          <div contenteditable="true" class="field-value">${field.value}</div>
      `;

      fieldsContainer.insertBefore(fieldElem, addFieldPlaceholder);
    });
  }

  _setupEventListeners() {

    this.elements.embedColorBar.addEventListener('click', () => {
      this.elements.colorPickerModal.style.display = 'flex';
    });


    this.elements.closeColorPicker.addEventListener('click', () => {
      this.elements.colorPickerModal.style.display = 'none';
    });


    this.elements.embedColorPicker.addEventListener('input', (e) => {
      const color = e.target.value.toUpperCase();
      this._updateEmbedColor(color);
    });

    this.elements.embedColorPicker.addEventListener('change', () => {
      this.elements.colorPickerModal.style.display = 'none';
      this._notifyUpdate();
    });


    const colorPresets = document.querySelectorAll('.color-preset');
    colorPresets.forEach(preset => {
      preset.addEventListener('click', () => {
        const color = preset.getAttribute('data-color');
        this._updateEmbedColor(color);
        this.elements.colorPickerModal.style.display = 'none';
        this._notifyUpdate();
      });
    });


    window.addEventListener('click', (e) => {
      if (e.target === this.elements.colorPickerModal) {
        this.elements.colorPickerModal.style.display = 'none';
      }
    });


    this.elements.addFieldPlaceholder.addEventListener('click', () => this._createField(false));
    this.elements.addFullWidthPlaceholder.addEventListener('click', () => this._createField(true));


    this._setupImageUploads();


    this._setupContentEditableListeners();


    this.elements.timestampCheckbox.addEventListener('change', () => {
      this.currentData.footer.timestamp = this.elements.timestampCheckbox.checked;
      this._notifyUpdate();
    });
  }

  _setupContentEditableListeners() {

    this.elements.previewTitle.addEventListener('input', () => {
      this.currentData.title = this.elements.previewTitle.innerText.trim();
      this._notifyUpdate();
    });


    this.elements.previewDescription.addEventListener('input', () => {
      this.currentData.description = this.elements.previewDescription.innerText.trim();
      this._notifyUpdate();
    });


    this.elements.authorName.addEventListener('input', () => {
      this.currentData.author.name = this.elements.authorName.innerText.trim();
      this._notifyUpdate();
    });


    this.elements.footerText.addEventListener('input', () => {
      this.currentData.footer.text = this.elements.footerText.innerText.trim();
      this._notifyUpdate();
    });


    this._setupFieldsObserver();
  }

  _setupFieldsObserver() {

    const observer = new MutationObserver(() => {
      this._updateFieldsData();
    });

    observer.observe(this.elements.fieldsContainer, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });
  }

  _updateFieldsData() {
    const fieldElements = this.elements.fieldsContainer.querySelectorAll('.embed-field');
    const fields = [];

    fieldElements.forEach(field => {
      const nameElem = field.querySelector('.field-name');
      const valueElem = field.querySelector('.field-value');

      if (nameElem && valueElem) {
        fields.push({
          name: nameElem.innerText.trim(),
          value: valueElem.innerText.trim(),
          inline: !field.classList.contains('full-width')
        });
      }
    });

    this.currentData.fields = fields;
    this._notifyUpdate();
  }

  _setupImageUploads() {

    this.elements.thumbnail.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.elements.thumbnail.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
            this.currentData.thumbnail = event.target.result;
            this._notifyUpdate();
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      };
      input.click();
    });


    this.elements.imagePanel.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.elements.imagePanel.innerHTML = `<img src="${event.target.result}" style="max-width:100%; max-height:300px; border-radius:4px;">`;
            this.currentData.image = event.target.result;
            this._notifyUpdate();
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      };
      input.click();
    });


    this.elements.authorIcon.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.elements.authorIcon.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            this.currentData.author.iconUrl = event.target.result;
            this._notifyUpdate();
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      };
      input.click();
    });
  }

  _createField(isFullWidth) {
    const MAX_FIELDS = 25;
    const fieldsContainer = this.elements.fieldsContainer;

    if (fieldsContainer.querySelectorAll('.embed-field').length >= MAX_FIELDS) return;

    const field = document.createElement('div');
    field.className = `embed-field${isFullWidth ? ' full-width' : ''}`;
    field.innerHTML = `
        <div contenteditable="true" class="field-name">Field Name</div>
        <button class="remove-field-button">✕</button>
        <div contenteditable="true" class="field-value">Field Value</div>
    `;

    const removeButton = field.querySelector('.remove-field-button');
    removeButton.addEventListener('click', () => {
      field.remove();
      this._updateFieldsData();

      if (fieldsContainer.querySelectorAll('.embed-field').length < MAX_FIELDS) {
        this.elements.addFieldPlaceholder.style.display = "flex";
        this.elements.addFullWidthPlaceholder.style.display = "flex";
      }
    });

    fieldsContainer.insertBefore(field, this.elements.addFieldPlaceholder);

    this._updateFieldsData();

    if (fieldsContainer.querySelectorAll('.embed-field').length >= MAX_FIELDS) {
      this.elements.addFieldPlaceholder.style.display = "none";
      this.elements.addFullWidthPlaceholder.style.display = "none";
    }
  }

  _updateEmbedColor(color) {
    this.currentData.color = color;
    this.elements.preview.style.borderLeftColor = color;
    this.elements.embedColorBar.style.backgroundColor = color;
    if (this.elements.embedColorPicker) this.elements.embedColorPicker.value = color;
  }

  _notifyUpdate() {
    const changedData = this._getChangedData();

    if (Object.keys(changedData).length > 0) {
      this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));
      this.trigger('update', changedData);
    }
  }

  _getChangedData() {
    const changes = {};

    const compareObjects = (lastKnown, current, path = '') => {
      if (typeof lastKnown !== 'object' || typeof current !== 'object') {
        if (lastKnown !== current) changes[path.slice(1)] = current;
        return;
      }

      if (Array.isArray(lastKnown) && Array.isArray(current)) {
        if (JSON.stringify(lastKnown) !== JSON.stringify(current)) changes[path.slice(1)] = current;
        return;
      }

      for (const key in current) {
        const newPath = `${path}.${key}`;

        if (lastKnown.hasOwnProperty(key)) {
          compareObjects(lastKnown[key], current[key], newPath);
        } else {
          changes[newPath.slice(1)] = current[key];
        }
      }

      for (const key in lastKnown) {
        if (!current.hasOwnProperty(key)) changes[`${path}.${key}`.slice(1)] = undefined;
      }
    };

    compareObjects(this.lastKnownData, this.currentData);
    return changes;
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'embed-creator-styles';
    style.textContent = `
      .embed-preview {
          background: #36393f;
          padding: 16px;
          border-radius: 4px;
          position: relative;
          width: 500px;
          color: #dcddde;
          border-left: 6px solid #5865F2;
          flex-shrink: 0;
          height: auto;
          position: relative;
      }

      .embed-preview .left-border {
          position: absolute;
          top: 0;
          left: -6px;
          width: 6px;
          height: 100%;
          background: #5865F2;
          cursor: pointer;
          border-radius: 4px 0 0 4px;
      }

      .embed-preview .left-border:hover {
          opacity: 0.8;
      }

      .embed-preview .embed-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .embed-preview .author-section {
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
      }

      .embed-preview .author-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2f3136;
          cursor: pointer;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
      }

      .embed-preview .author-name {
          font-size: 14px;
          color: white;
          cursor: text;
      }

      .embed-preview .embed-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          text-align: left;
          margin-top: 5px;
          max-width: 375px;
      }

      .embed-preview .embed-description {
          font-size: 14px;
          text-align: left;
          margin-top: 10px;
          margin-bottom: 5px;
          max-width: 375px;
      }

      .embed-preview .thumbnail {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 100px;
          height: 100px;
          background: #2f3136;
          border-radius: 4px;
          cursor: pointer;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0;
          background-size: cover;
          background-position: center;
          overflow: hidden;
      }

      .embed-preview .image-panel {
          margin-top: 10px;
          cursor: pointer;
          background: #2f3136;
          border-radius: 4px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          overflow: hidden;
      }

      .embed-preview .fields-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
      }

      .embed-preview .embed-field {
          background: #2f3136;
          padding: 10px;
          border-radius: 4px;
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: 8px;
          width: calc(33.33% - 26px);
          align-items: center;
      }

      .embed-preview .embed-field.full-width {
          width: 100%;
      }

      .embed-preview .field-name,
      .embed-preview .field-value {
          grid-column: 1 / 2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
      }

      .embed-preview .remove-field-button {
          grid-column: 2 / 3;
          background: none;
          border: none;
          color: #72767d;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          transition: color 0.2s;
          justify-self: end;
      }

      .embed-preview .remove-field-button:hover {
          color: #f04747;
      }

      .embed-preview .add-field-placeholder {
          width: calc(33.33% - 26px);
          height: 54px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #72767d;
          cursor: pointer;
      }

      .embed-preview .add-full-width-placeholder {
          width: 100%;
          height: 54px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #72767d;
          cursor: pointer;
          margin-top: 8px;
      }

      .embed-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          color: #b9bbbe;
      }

      .footer-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: text;
          text-align: left;
      }

      .timestamp-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #b9bbbe;
      }

      #timestamp-checkbox {
          cursor: pointer;
      }


      .color-picker-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #2c2f33;
          border: 1px solid #5865F2;
          border-radius: 8px;
          width: 300px;
          overflow: hidden;
          z-index: 1000;
          display: flex;
          flex-direction: column;
      }

      .color-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          background: #23272a;
          border-bottom: 1px solid #5865F2;
      }

      .color-picker-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 16px;
      }

      .color-picker-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
      }

      #embed-color-picker {
          -webkit-appearance: none;
          border: none;
          width: 100%;
          height: 40px;
          cursor: pointer;
          background: none;
          border-radius: 4px;
      }

      #embed-color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
      }

      #embed-color-picker::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
      }

      .color-presets {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
      }

      .color-preset {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s;
          border: 2px solid transparent;
      }

      .color-preset:hover {
          transform: scale(1.1);
          border-color: #ffffff;
      }

      .close-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  getData() {
    return this.currentData;
  }

  setData(newData) {
    this.currentData = { ...this.currentData, ...newData };
    this._createDOM();
    this._setupEventListeners();
    return this;
  }

  toJSON() {
    const embed = {
      title: this.currentData.title || undefined,
      description: this.currentData.description || undefined,
      color: this.currentData.color ? parseInt(this.currentData.color.replace('#', ''), 16) : undefined,
      author: this.currentData.author && this.currentData.author.name ? {
        name: this.currentData.author.name,
        icon_url: this.currentData.author.iconUrl || undefined
      } : undefined,
      thumbnail: this.currentData.thumbnail ? { url: this.currentData.thumbnail } : undefined,
      image: this.currentData.image ? { url: this.currentData.image } : undefined,
      fields: this.currentData.fields && this.currentData.fields.length > 0 ?
        this.currentData.fields.map(field => ({
          name: field.name,
          value: field.value,
          inline: field.inline !== false
        })) : undefined,
      footer: this.currentData.footer && (this.currentData.footer.text || this.currentData.footer.timestamp) ? {
        text: this.currentData.footer.text || ''
      } : undefined,
      timestamp: this.currentData.footer && this.currentData.footer.timestamp ?
        new Date().toISOString() : undefined
    };

    Object.keys(embed).forEach(key => {
      if (embed[key] === undefined) delete embed[key];
      else if (typeof embed[key] === 'object' && !Array.isArray(embed[key])) {
        Object.keys(embed[key]).forEach(subKey => {
          if (embed[key][subKey] === undefined) delete embed[key][subKey];
        });
        if (Object.keys(embed[key]).length === 0) delete embed[key];
      }
    });

    return embed;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZEmbedCreator;
} else {
  window.EZEmbedCreator = EZEmbedCreator;
}
