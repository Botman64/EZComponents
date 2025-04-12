/**
 * Button Creator Component
 * An interactive component for creating customizable buttons
 *
 * Usage:
 * const creator = new EZButtonCreator(containerElement, options);
 * creator.init();
 * creator.on('update', (data) => {
 *   console.log('Button updated:', data);
 * });
 */

class EZButtonCreator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialData: options.initialData || {},
      stylesAvailable: options.stylesAvailable || ['primary', 'secondary', 'success', 'danger', 'link'],
      ...options
    };

    this.elements = {};
    this.eventHandlers = {
      update: []
    };

    this.currentData = {
      text: 'Button',
      style: 'primary',
      emoji: '',
      url: '',
      disabled: false
    };

    if (options.initialData) {
      this.currentData = { ...this.currentData, ...options.initialData };
    }

    this.originalData = JSON.parse(JSON.stringify(this.currentData));
    this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));

    this.emojis = [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
      '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
      '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
      '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
      '🎮', '🎯', '🎲', '🎭', '🎨', '🎪', '🎫', '🎟️', '🎪', '🎭',
      '💻', '🖥️', '📱', '📲', '☎️', '📞', '📟', '📠', '📺', '📻',
      '🎵', '🎶', '🎙️', '🎚️', '🎛️', '🎤', '🎧', '📻', '🎷', '🎸',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '✨', '🎉', '🎊', '🎈', '🎂', '🎁', '🎗️', '🎟️', '🎫', '🎖️'
    ];
  }

  init() {
    this._createDOM();
    this._setupEventListeners();
    return this;
  }

  on(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(callback);
    }
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
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(callback => callback(data));
    }
    return this;
  }

  _createDOM() {
    this.container.innerHTML = '';

    const buttonElement = document.createElement('div');
    buttonElement.className = 'creator-button btn';
    buttonElement.classList.add(`btn-${this.currentData.style}`);

    if (this.currentData.disabled) {
      buttonElement.classList.add('btn-disabled');
    }

    let buttonHTML = '';

    if (this.currentData.emoji) {
      buttonHTML += `
          <div class="emoji-container">
              <span class="btn-emoji">${this.currentData.emoji}</span>
              <button class="emoji-remove-btn" title="Remove emoji">×</button>
          </div>
      `;
    } else {
      buttonHTML += `<span class="emoji-ghost-button" title="Add emoji">+</span>`;
    }

    buttonHTML += `<span class="btn-text" contenteditable="true">${this.currentData.text}</span>`;

    buttonElement.innerHTML = buttonHTML;

    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'emoji-picker';
    emojiPicker.id = 'emoji-picker';
    emojiPicker.style.display = 'none';

    emojiPicker.innerHTML = `
        <div class="emoji-picker-header">
            <input type="text" id="emoji-search" placeholder="Search emojis...">
            <button id="close-emoji-picker" class="close-button">✕</button>
        </div>
        <div class="emoji-list" id="emoji-list"></div>
      `;

    const settingsModal = document.createElement('div');
    settingsModal.className = 'button-settings-modal';
    settingsModal.id = 'button-settings-modal';
    settingsModal.style.display = 'none';

    settingsModal.innerHTML = `
            <div class="modal-header">
                <h4>Button Settings</h4>
                <button id="close-settings" class="close-button">✕</button>
            </div>
            <div class="modal-content">
                <div class="setting-group">
                    <label>Style</label>
                    <div class="style-options">
                        ${this.options.stylesAvailable.map(style => `
                            <div class="style-option ${this.currentData.style === style ? 'selected' : ''}" data-style="${style}">
                                ${style}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="setting-group">
                    <label for="button-url">URL (Optional)</label>
                    <input type="text" id="button-url" class="setting-input" value="${this.currentData.url}" placeholder="https://example.com">
                </div>

                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="button-disabled" ${this.currentData.disabled ? 'checked' : ''}>
                        <span>Disabled</span>
                    </label>
                </div>
            </div>
        `;

    const backgroundOverlay = document.createElement('div');
    backgroundOverlay.className = 'button-background-overlay';
    backgroundOverlay.id = 'button-background-overlay';

    this.container.appendChild(buttonElement);
    this.container.appendChild(emojiPicker);
    this.container.appendChild(settingsModal);
    this.container.appendChild(backgroundOverlay);

    const emojiList = document.getElementById('emoji-list');
    this.emojis.forEach(emoji => {
      const emojiElement = document.createElement('div');
      emojiElement.className = 'emoji-item';
      emojiElement.textContent = emoji;
      emojiElement.setAttribute('data-emoji', emoji);
      emojiList.appendChild(emojiElement);
    });

    if (!document.getElementById('button-creator-styles')) {
      this._addStyles();
    }

    this.elements = {
      button: buttonElement,
      buttonText: buttonElement.querySelector('.btn-text'),
      emojiGhost: buttonElement.querySelector('.emoji-ghost-button'),
      emojiContainer: buttonElement.querySelector('.emoji-container'),
      emojiRemoveBtn: buttonElement.querySelector('.emoji-remove-btn'),
      emojiPicker: document.getElementById('emoji-picker'),
      emojiSearch: document.getElementById('emoji-search'),
      emojiList: document.getElementById('emoji-list'),
      closeEmojiPicker: document.getElementById('close-emoji-picker'),
      settingsModal: document.getElementById('button-settings-modal'),
      closeSettings: document.getElementById('close-settings'),
      buttonUrl: document.getElementById('button-url'),
      buttonDisabled: document.getElementById('button-disabled'),
      styleOptions: document.querySelectorAll('.style-option'),
      backgroundOverlay: document.getElementById('button-background-overlay')
    };
  }

  _setupEventListeners() {
    this.elements.buttonText.addEventListener('input', () => {
      this.currentData.text = this.elements.buttonText.textContent.trim();
      this._notifyUpdate();
    });

    this.elements.buttonText.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    if (this.elements.emojiGhost) {
      this.elements.emojiGhost.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openEmojiPicker(e);
      });
    }

    if (this.elements.emojiRemoveBtn) {
      this.elements.emojiRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeEmoji();
      });
    }

    if (this.elements.emojiContainer) {
      this.elements.emojiContainer.addEventListener('click', (e) => {
        if (e.target !== this.elements.emojiRemoveBtn) {
          e.stopPropagation();
          this._openEmojiPicker(e);
        }
      });
    }

    this.elements.button.addEventListener('click', (e) => {
      if (e.target === this.elements.button) {
        this._openSettingsModal(e);
      }
    });

    this.elements.backgroundOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.backgroundOverlay) {
        this._hideBackgroundOverlay();
        this.elements.settingsModal.style.display = 'none';
      }
    });

    this.elements.closeEmojiPicker.addEventListener('click', () => {
      this.elements.emojiPicker.style.display = 'none';
    });

    this.elements.closeSettings.addEventListener('click', () => {
      this.elements.settingsModal.style.display = 'none';
      this._hideBackgroundOverlay();
    });

    this.elements.emojiList.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-item')) {
        const emoji = e.target.getAttribute('data-emoji');
        this.setEmoji(emoji);
        this.elements.emojiPicker.style.display = 'none';
      }
    });

    this.elements.emojiSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const emojiItems = this.elements.emojiList.querySelectorAll('.emoji-item');

      emojiItems.forEach(item => {
        const emoji = item.textContent;
        if (searchTerm === '' || emoji.toLowerCase().includes(searchTerm)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });

    this.elements.styleOptions.forEach(option => {
      option.addEventListener('click', () => {
        const style = option.getAttribute('data-style');
        this.setStyle(style);

        this.elements.styleOptions.forEach(opt => {
          opt.classList.remove('selected');
        });
        option.classList.add('selected');
      });
    });

    this.elements.buttonUrl.addEventListener('input', () => {
      this.currentData.url = this.elements.buttonUrl.value.trim();
      this._notifyUpdate();
    });

    this.elements.buttonDisabled.addEventListener('change', () => {
      this.setDisabled(this.elements.buttonDisabled.checked);
    });

    window.addEventListener('scroll', () => {
      this.elements.emojiPicker.style.display = 'none';
      this.elements.settingsModal.style.display = 'none';
      this._hideBackgroundOverlay();
    });

    document.addEventListener('click', (e) => {
      if (this.elements.emojiPicker.style.display !== 'none' &&
        !this.elements.emojiPicker.contains(e.target) &&
        (!this.elements.emojiGhost || !this.elements.emojiGhost.contains(e.target)) &&
        (!this.elements.emojiContainer || !this.elements.emojiContainer.contains(e.target))) {
        this.elements.emojiPicker.style.display = 'none';
      }

      if (this.elements.settingsModal.style.display !== 'none' &&
        !this.elements.settingsModal.contains(e.target) &&
        !this.elements.button.contains(e.target)) {
        this.elements.settingsModal.style.display = 'none';
        this._hideBackgroundOverlay();
      }

      if (this.elements.backgroundOverlay.style.display !== 'none' &&
        !this.elements.button.contains(e.target) &&
        !this.elements.settingsModal.contains(e.target)) {
        this._hideBackgroundOverlay();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._hideBackgroundOverlay();
        this.elements.emojiPicker.style.display = 'none';
        this.elements.settingsModal.style.display = 'none';
      }
    });
  }

  _showBackgroundOverlay() {
    this.elements.backgroundOverlay.style.display = 'block';
  }

  _hideBackgroundOverlay() {
    this.elements.backgroundOverlay.style.display = 'none';
  }

  _openEmojiPicker(clickEvent) {
    this.elements.settingsModal.style.display = 'none';
    this._hideBackgroundOverlay();

    const pickerStyle = this.elements.emojiPicker.style;
    pickerStyle.position = 'fixed';
    pickerStyle.top = `${clickEvent.clientY}px`;
    pickerStyle.left = `${clickEvent.clientX}px`;
    pickerStyle.display = 'block';

    setTimeout(() => {
      const pickerRect = this.elements.emojiPicker.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (pickerRect.right > viewportWidth) {
        pickerStyle.left = `${viewportWidth - pickerRect.width - 10}px`;
      }

      if (pickerRect.bottom > viewportHeight) {
        pickerStyle.top = `${viewportHeight - pickerRect.height - 10}px`;
      }
    }, 0);

    this.elements.emojiSearch.focus();
  }

  _openSettingsModal(clickEvent) {
    this.elements.emojiPicker.style.display = 'none';

    const modalStyle = this.elements.settingsModal.style;
    modalStyle.position = 'fixed';

    modalStyle.top = `${clickEvent.clientY}px`;
    modalStyle.left = `${clickEvent.clientX}px`;
    modalStyle.display = 'block';

    setTimeout(() => {
      const modalRect = this.elements.settingsModal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (modalRect.right > viewportWidth) {
        modalStyle.left = `${viewportWidth - modalRect.width - 10}px`;
      }

      if (modalRect.bottom > viewportHeight) {
        modalStyle.top = `${viewportHeight - modalRect.height - 10}px`;
      }
    }, 0);
  }

  setEmoji(emoji) {
    this.currentData.emoji = emoji;

    this._createDOM();
    this._setupEventListeners();

    this._notifyUpdate();
  }

  removeEmoji() {
    this.currentData.emoji = '';

    this._createDOM();
    this._setupEventListeners();
    this._notifyUpdate();
  }

  setStyle(style) {
    this.elements.button.classList.remove(`btn-${this.currentData.style}`);
    this.currentData.style = style;
    this.elements.button.classList.add(`btn-${style}`);

    this._notifyUpdate();
    return this;
  }

  setDisabled(disabled) {
    this.currentData.disabled = disabled;

    if (disabled) {
      this.elements.button.classList.add('btn-disabled');
    } else {
      this.elements.button.classList.remove('btn-disabled');
    }

    this._notifyUpdate();
  }

  _notifyUpdate() {
    // Compare current data with last known data
    const changedData = this._getChangedData();

    if (Object.keys(changedData).length > 0) {
      // Update last known data before triggering the event
      this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));

      // Only trigger if there are changes, and only send the changed data
      this.trigger('update', changedData);
    }
  }

  _getChangedData() {
    const changes = {};

    for (const key in this.currentData) {
      if (JSON.stringify(this.currentData[key]) !== JSON.stringify(this.lastKnownData[key])) {
        changes[key] = this.currentData[key];
      }
    }

    return changes;
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'button-creator-styles';
    style.textContent = `
        .creator-button {
            position: relative;
            cursor: pointer;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            padding: 10px 16px;
            border-radius: 3px;
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            line-height: 16px;
            transition: background-color 0.17s ease, color 0.17s ease;
            margin: 4px;
            gap: 8px;
            user-select: none;
        }

        .btn-primary {
            background-color: #5865F2;
            color: white;
        }

        .btn-primary:hover {
            background-color: #4752C4;
        }

        .btn-secondary {
            background-color: #4F545C;
            color: white;
        }

        .btn-secondary:hover {
            background-color: #686D73;
        }

        .btn-success {
            background-color: #57F287;
            color: white;
        }

        .btn-success:hover {
            background-color: #45C46C;
        }

        .btn-danger {
            background-color: #ED4245;
            color: white;
        }

        .btn-danger:hover {
            background-color: #D83C3E;
        }

        .btn-link {
            background-color: transparent;
            color: white;
            text-decoration: underline;
            padding: 10px 8px;
        }

        .btn-link:hover {
            text-decoration: none;
        }

        .btn-disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-text {
            outline: none;
            min-width: 20px;
        }

        .btn-emoji {
            font-size: 18px;
            line-height: 1;
        }

        /* Ghost button for emoji */
        .emoji-ghost-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.15);
            font-size: 14px;
            cursor: pointer;
            color: inherit;
            transition: background-color 0.2s;
        }

        .emoji-ghost-button:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }

        /* Emoji container with remove button */
        .emoji-container {
            position: relative;
            display: inline-flex;
            align-items: center;
        }

        .emoji-remove-btn {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #4f545c;
            color: white;
            border: none;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .emoji-container:hover .emoji-remove-btn {
            opacity: 1;
        }

        .emoji-remove-btn:hover {
            background-color: #686D73;
        }

        /* Background overlay */
        .button-background-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 900;
        }

        /* Emoji Picker Styles */
        .emoji-picker {
            background-color: #36393f;
            border: 1px solid #202225;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            width: 300px;
            max-height: 400px;
            overflow: hidden;
            z-index: 1000;
            position: fixed;
        }

        .emoji-picker-header {
            display: flex;
            padding: 8px;
            border-bottom: 1px solid #202225;
            background-color: #2f3136;
        }

        .emoji-picker-header input {
            flex-grow: 1;
            background-color: #40444b;
            border: none;
            border-radius: 3px;
            color: #dcddde;
            padding: 8px;
            font-size: 14px;
            outline: none;
        }

        .emoji-list {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
            padding: 10px;
            max-height: 300px;
            overflow-y: auto;
        }

        .emoji-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            font-size: 22px;
            cursor: pointer;
            border-radius: 3px;
        }

        .emoji-item:hover {
            background-color: #40444b;
        }

        /* Settings Modal Styles */
        .button-settings-modal {
            background-color: #36393f;
            border: 1px solid #202225;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            width: 300px;
            z-index: 1000;
            position: fixed;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #202225;
            background-color: #2f3136;
        }

        .modal-header h4 {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
        }

        .close-button {
            background: none;
            border: none;
            color: #dcddde;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }

        .close-button:hover {
            color: #ffffff;
        }

        .modal-content {
            padding: 16px;
        }

        .setting-group {
            margin-bottom: 16px;
        }

        .setting-group:last-child {
            margin-bottom: 0;
        }

        .setting-group label {
            display: block;
            margin-bottom: 8px;
            color: #b9bbbe;
            font-size: 14px;
            font-weight: 600;
        }

        .setting-input {
            width: 100%;
            background-color: #40444b;
            border: 1px solid #202225;
            border-radius: 3px;
            color: #dcddde;
            padding: 8px;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        }

        .setting-input:focus {
            border-color: #7289da;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            user-select: none;
            cursor: pointer;
        }

        .checkbox-label input {
            margin-right: 8px;
        }

        .style-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .style-option {
            background-color: #40444b;
            border-radius: 3px;
            padding: 8px 12px;
            color: #dcddde;
            font-size: 14px;
            cursor: pointer;
            text-transform: capitalize;
        }

        .style-option:hover {
            background-color: #4f545c;
        }

        .style-option.selected {
            background-color: #7289da;
            color: #ffffff;
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
    return {
      text: this.currentData.text,
      style: this.currentData.style,
      emoji: this.currentData.emoji || undefined,
      url: this.currentData.url || undefined,
      disabled: this.currentData.disabled || undefined
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZButtonCreator;
} else {
  window.EZButtonCreator = EZButtonCreator;
}
