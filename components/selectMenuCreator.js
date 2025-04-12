/**
 * Select Menu Creator Component
 * An interactive component for creating customizable select menus
 *
 * Usage:
 * const creator = new EZSelectMenuCreator(containerElement, options);
 * creator.init();
 * creator.on('update', (data) => {
 *   console.log('Select menu updated:', data);
 * });
 */

class EZSelectMenuCreator {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            initialData: options.initialData || {},
            ...options
        };

        this.elements = {};
        this.eventHandlers = {
            update: []
        };

        // Default starting data
        this.currentData = {
            placeholder: 'Select an option',
            options: [],
            disabled: false,
            value: null
        };

        // Apply initial data if provided
        if (options.initialData) {
            this.currentData = {...this.currentData, ...options.initialData};
        }

        // Track last known data to detect changes
        this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));

        // Used to generate unique IDs for options
        this.optionIdCounter = 0;
    }

    init() {
        this._createDOM();
        this._setupEventListeners();
        return this;
    }

    // Event handling methods
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
        // Clear container
        this.container.innerHTML = '';

        // Create main container
        const creatorContainer = document.createElement('div');
        creatorContainer.className = 'ez-select-creator';

        // Build header with basic settings
        let headerHTML = `
            <div class="creator-header">
                <h3>Select Menu Creator</h3>
                <div class="setting-group">
                    <label for="select-placeholder">Placeholder:</label>
                    <input type="text" id="select-placeholder" class="setting-input" value="${this.currentData.placeholder}">
                </div>
                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="select-disabled" ${this.currentData.disabled ? 'checked' : ''}>
                        <span>Disabled</span>
                    </label>
                </div>
            </div>
        `;

        // Build options section
        let optionsHTML = `
            <div class="options-section">
                <div class="options-header">
                    <h4>Options</h4>
                    <button id="add-option" class="ez-button">Add Option</button>
                </div>
                <div id="options-container" class="options-container">
                    ${this._renderOptions()}
                </div>
            </div>
        `;

        // Build preview section
        let previewHTML = `
            <div class="preview-section">
                <h4>Preview</h4>
                <div id="select-preview" class="select-preview"></div>
            </div>
        `;

        // Combine all sections
        creatorContainer.innerHTML = headerHTML + optionsHTML + previewHTML;

        // Add to container
        this.container.appendChild(creatorContainer);

        // Store element references
        this.elements = {
            root: creatorContainer,
            placeholderInput: document.getElementById('select-placeholder'),
            disabledCheckbox: document.getElementById('select-disabled'),
            addOptionButton: document.getElementById('add-option'),
            optionsContainer: document.getElementById('options-container'),
            previewContainer: document.getElementById('select-preview')
        };

        // Add styles if they don't exist
        if (!document.getElementById('ez-select-creator-styles')) {
            this._addStyles();
        }

        // Initialize preview
        this._updatePreview();
    }

    _renderOptions() {
        if (!this.currentData.options.length) {
            return '<div class="no-options">No options added yet. Click "Add Option" to create one.</div>';
        }

        return this.currentData.options.map((option, index) => `
            <div class="option-editor" data-index="${index}">
                <div class="option-header">
                    <h5>Option ${index + 1}</h5>
                    <div class="option-actions">
                        <button class="move-up-btn" title="Move Up">↑</button>
                        <button class="move-down-btn" title="Move Down">↓</button>
                        <button class="delete-option-btn" title="Delete">×</button>
                    </div>
                </div>
                <div class="option-fields">
                    <div class="setting-group">
                        <label>Label/Title:</label>
                        <input type="text" class="setting-input option-label" value="${option.label || option.title || ''}">
                    </div>
                    <div class="setting-group">
                        <label>Value:</label>
                        <input type="text" class="setting-input option-value" value="${option.value || ''}">
                    </div>
                    <div class="setting-group">
                        <label>Description (optional):</label>
                        <input type="text" class="setting-input option-description" value="${option.description || ''}">
                    </div>
                    <div class="setting-group">
                        <label>Emoji (optional):</label>
                        <div class="emoji-input-container">
                            <input type="text" class="setting-input option-emoji" value="${option.emoji || ''}" readonly placeholder="Click to add emoji">
                            <button class="emoji-picker-toggle">😊</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    _setupEventListeners() {
        // Placeholder input
        this.elements.placeholderInput.addEventListener('input', () => {
            this.currentData.placeholder = this.elements.placeholderInput.value;
            this._updatePreview();
            this._notifyUpdate();
        });

        // Disabled checkbox
        this.elements.disabledCheckbox.addEventListener('change', () => {
            this.currentData.disabled = this.elements.disabledCheckbox.checked;
            this._updatePreview();
            this._notifyUpdate();
        });

        // Add option button
        this.elements.addOptionButton.addEventListener('click', () => {
            this.addOption();
        });

        // Option container delegation for buttons
        this.elements.optionsContainer.addEventListener('click', (e) => {
            const optionEditor = e.target.closest('.option-editor');
            if (!optionEditor) return;

            const index = parseInt(optionEditor.getAttribute('data-index'), 10);

            if (e.target.classList.contains('delete-option-btn')) {
                this.deleteOption(index);
            } else if (e.target.classList.contains('move-up-btn')) {
                this.moveOption(index, -1);
            } else if (e.target.classList.contains('move-down-btn')) {
                this.moveOption(index, 1);
            } else if (e.target.classList.contains('emoji-picker-toggle') ||
                      (e.target.classList.contains('option-emoji') && !e.target.value)) {
                this._showEmojiPicker(e, index);
            }
        });

        // Option inputs
        this.elements.optionsContainer.addEventListener('input', (e) => {
            const optionEditor = e.target.closest('.option-editor');
            if (!optionEditor) return;

            const index = parseInt(optionEditor.getAttribute('data-index'), 10);

            if (e.target.classList.contains('option-label')) {
                this.currentData.options[index].label = e.target.value;
                // Update title for backward compatibility
                this.currentData.options[index].title = e.target.value;
            } else if (e.target.classList.contains('option-value')) {
                this.currentData.options[index].value = e.target.value;
            } else if (e.target.classList.contains('option-description')) {
                this.currentData.options[index].description = e.target.value;
            }

            this._updatePreview();
            this._notifyUpdate();
        });
    }

    _showEmojiPicker(event, optionIndex) {
        // Create emoji picker if it doesn't exist
        if (!document.getElementById('emoji-picker')) {
            this._createEmojiPicker();
        }

        const emojiPicker = document.getElementById('emoji-picker');
        const emojiList = document.getElementById('emoji-list');

        // Position emoji picker
        emojiPicker.style.position = 'fixed';
        emojiPicker.style.top = `${event.clientY}px`;
        emojiPicker.style.left = `${event.clientX}px`;
        emojiPicker.style.display = 'block';

        // Store the option index for later use
        emojiPicker.setAttribute('data-option-index', optionIndex);

        // Focus search input
        document.getElementById('emoji-search').focus();

        // Close when clicking outside
        const closeEmojiPicker = (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== event.target) {
                emojiPicker.style.display = 'none';
                document.removeEventListener('click', closeEmojiPicker);
            }
        };

        // Wait a bit to add the click listener to avoid immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeEmojiPicker);
        }, 100);
    }

    _createEmojiPicker() {
        // Create emoji picker element
        const emojiPicker = document.createElement('div');
        emojiPicker.id = 'emoji-picker';
        emojiPicker.className = 'emoji-picker';

        // Add header with search
        emojiPicker.innerHTML = `
            <div class="emoji-picker-header">
                <input type="text" id="emoji-search" placeholder="Search emojis...">
                <button id="close-emoji-picker" class="close-button">✕</button>
            </div>
            <div id="emoji-list" class="emoji-list"></div>
        `;

        // Add to body
        document.body.appendChild(emojiPicker);

        // Populate with emojis
        const emojiList = document.getElementById('emoji-list');
        const emojis = [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
            '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
            '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
            '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
            '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👊', '✊', '🤛',
            '💻', '📱', '📞', '📟', '📠', '📺', '📻', '🎮', '🕹️', '🎵',
            '🔥', '✨', '🎉', '🎊', '💯', '💪', '👑', '🏆', '🥇', '🎯'
        ];

        emojis.forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiList.appendChild(emojiItem);

            emojiItem.addEventListener('click', () => {
                const optionIndex = parseInt(emojiPicker.getAttribute('data-option-index'), 10);
                this.setOptionEmoji(optionIndex, emoji);
                emojiPicker.style.display = 'none';
            });
        });

        // Add search functionality
        const searchInput = document.getElementById('emoji-search');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            document.querySelectorAll('.emoji-item').forEach(item => {
                const visible = !searchTerm || item.textContent.includes(searchTerm);
                item.style.display = visible ? 'block' : 'none';
            });
        });

        // Close button
        document.getElementById('close-emoji-picker').addEventListener('click', () => {
            emojiPicker.style.display = 'none';
        });

        // Add styles if they don't exist
        if (!document.getElementById('emoji-picker-styles')) {
            const style = document.createElement('style');
            style.id = 'emoji-picker-styles';
            style.textContent = `
                .emoji-picker {
                    background-color: #36393f;
                    border: 1px solid #202225;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    width: 300px;
                    max-height: 400px;
                    overflow: hidden;
                    z-index: 1000;
                    display: none;
                }

                .emoji-picker-header {
                    display: flex;
                    padding: 8px;
                    border-bottom: 1px solid #202225;
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

                .close-button {
                    background: none;
                    border: none;
                    color: #dcddde;
                    font-size: 16px;
                    cursor: pointer;
                    margin-left: 8px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    _updatePreview() {
        // Clear previous preview
        this.elements.previewContainer.innerHTML = '';

        // Create select menu
        const selectMenu = new EZSelectMenu(
            this.elements.previewContainer,
            this.currentData
        );

        selectMenu.render();
    }

    _notifyUpdate() {
        // Compare current data with last known data
        const changedData = this._getChangedData();

        if (Object.keys(changedData).length > 0) {
            // Update last known data before triggering the event
            this.lastKnownData = JSON.parse(JSON.stringify(this.currentData));

            // Only trigger if there are changes
            this.trigger('update', changedData);
        }
    }

    _getChangedData() {
        const changes = {};

        // Compare simple properties
        ['placeholder', 'disabled', 'value'].forEach(key => {
            if (this.currentData[key] !== this.lastKnownData[key]) {
                changes[key] = this.currentData[key];
            }
        });

        // Compare options array
        if (JSON.stringify(this.currentData.options) !== JSON.stringify(this.lastKnownData.options)) {
            changes.options = this.currentData.options;
        }

        return changes;
    }

    _addStyles() {
        const style = document.createElement('style');
        style.id = 'ez-select-creator-styles';
        style.textContent = `
            .ez-select-creator {
                font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #dcddde;
                background-color: #36393f;
                border-radius: 8px;
                padding: 20px;
                width: 100%;
                max-width: 600px;
                box-sizing: border-box;
            }

            .creator-header h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #ffffff;
                font-size: 18px;
            }

            .setting-group {
                margin-bottom: 15px;
            }

            .setting-group label {
                display: block;
                margin-bottom: 5px;
                color: #b9bbbe;
                font-size: 14px;
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
                border-color: #5865f2;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                user-select: none;
                cursor: pointer;
            }

            .checkbox-label input[type="checkbox"] {
                margin-right: 8px;
            }

            .options-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .options-header h4 {
                margin: 0;
                color: #ffffff;
                font-size: 16px;
            }

            .ez-button {
                background-color: #5865f2;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 8px 16px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .ez-button:hover {
                background-color: #4752c4;
            }

            .options-container {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 20px;
            }

            .no-options {
                color: #b9bbbe;
                font-style: italic;
                padding: 10px;
                background-color: #2f3136;
                border-radius: 3px;
            }

            .option-editor {
                background-color: #2f3136;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 10px;
            }

            .option-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .option-header h5 {
                margin: 0;
                color: #ffffff;
                font-size: 14px;
            }

            .option-actions {
                display: flex;
                gap: 5px;
            }

            .option-actions button {
                background-color: #4f545c;
                color: white;
                border: none;
                border-radius: 3px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
            }

            .option-actions button:hover {
                background-color: #5d626b;
            }

            .delete-option-btn {
                background-color: #ed4245 !important;
            }

            .delete-option-btn:hover {
                background-color: #f04747 !important;
            }

            .preview-section h4 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #ffffff;
                font-size: 16px;
            }

            .select-preview {
                padding: 10px;
                background-color: #2f3136;
                border-radius: 5px;
            }

            .emoji-input-container {
                display: flex;
                gap: 5px;
            }

            .emoji-picker-toggle {
                background-color: #4f545c;
                color: white;
                border: none;
                border-radius: 3px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }

    // Public methods
    addOption() {
        const newOption = {
            label: `Option ${this.currentData.options.length + 1}`,
            title: `Option ${this.currentData.options.length + 1}`,
            value: `option-${++this.optionIdCounter}`,
            description: '',
            emoji: ''
        };

        this.currentData.options.push(newOption);
        this._recreateOptions();
        this._updatePreview();
        this._notifyUpdate();

        return this;
    }

    deleteOption(index) {
        if (index >= 0 && index < this.currentData.options.length) {
            this.currentData.options.splice(index, 1);
            this._recreateOptions();
            this._updatePreview();
            this._notifyUpdate();
        }
        return this;
    }

    moveOption(index, direction) {
        if (index >= 0 && index < this.currentData.options.length) {
            const newIndex = index + direction;

            if (newIndex >= 0 && newIndex < this.currentData.options.length) {
                const option = this.currentData.options[index];
                this.currentData.options.splice(index, 1);
                this.currentData.options.splice(newIndex, 0, option);

                this._recreateOptions();
                this._updatePreview();
                this._notifyUpdate();
            }
        }
        return this;
    }

    setOptionEmoji(index, emoji) {
        if (index >= 0 && index < this.currentData.options.length) {
            this.currentData.options[index].emoji = emoji;

            // Update the input field
            const optionEditors = this.elements.optionsContainer.querySelectorAll('.option-editor');
            if (optionEditors[index]) {
                const emojiInput = optionEditors[index].querySelector('.option-emoji');
                if (emojiInput) {
                    emojiInput.value = emoji;
                }
            }

            this._updatePreview();
            this._notifyUpdate();
        }
        return this;
    }

    _recreateOptions() {
        this.elements.optionsContainer.innerHTML = this._renderOptions();
    }

    // Get/set methods
    getData() {
        return this.currentData;
    }

    setData(newData) {
        this.currentData = {...this.currentData, ...newData};
        // Re-init to update visuals
        this._createDOM();
        this._setupEventListeners();
        return this;
    }

    toJSON() {
        return JSON.parse(JSON.stringify(this.currentData));
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EZSelectMenuCreator;
} else {
    window.EZSelectMenuCreator = EZSelectMenuCreator;
}
