/**
 * Discord-like Embed Component
 * A modular component that creates Discord-style embeds
 *
 * Usage:
 * const myEmbed = new EZEmbed(containerElement, options);
 * myEmbed.render();
 */

class EZEmbed {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      title: options.title || 'Title',
      description: options.description || 'Description',
      color: options.color || '#5865F2',
      author: options.author || { name: '', iconUrl: '' },
      thumbnail: options.thumbnail || '',
      image: options.image || '',
      fields: options.fields || [],
      footer: options.footer || { text: '', timestamp: false },
      ...options
    };

    this.element = null;
    this.colorClickCallback = options.onColorClick || null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'discord-embed';
    this.element.style.borderLeftColor = this.options.color;

    this.element.innerHTML = `
      <div class="left-border"></div>
      <div class="embed-content">
        ${this._renderAuthor()}
        ${this._renderTitle()}
        ${this._renderDescription()}
        ${this._renderFields()}
        ${this._renderImage()}
        ${this._renderFooter()}
      </div>
      ${this._renderThumbnail()}
    `;

    if (!document.getElementById('discord-embed-styles')) this._addStyles();

    const leftBorder = this.element.querySelector('.left-border');
    leftBorder.style.backgroundColor = this.options.color;

    if (this.colorClickCallback) {
      leftBorder.style.cursor = 'pointer';
      leftBorder.addEventListener('click', () => {
        this.colorClickCallback(this.options.color, (newColor) => {
          this.setColor(newColor);
        });
      });
    }

    this.container.appendChild(this.element);
    return this.element;
  }

  _renderAuthor() {
    if (!this.options.author || !this.options.author.name) return '';

    return `
      <div class="author-section">
        ${this.options.author.iconUrl ? `<div class="author-icon"><img src="${this.options.author.iconUrl}" alt=""></div>` : ''}
        <div class="author-name">${this.options.author.name}</div>
      </div>
    `;
  }

  _renderTitle() {
    if (!this.options.title) return '';
    return `<div class="embed-title">${this.options.title}</div>`;
  }

  _renderDescription() {
    if (!this.options.description) return '';
    return `<div class="embed-description">${this.options.description}</div>`;
  }

  _renderFields() {
    if (!this.options.fields || this.options.fields.length === 0) return '';

    return `
      <div class="fields-container">
        ${this.options.fields.map(field => `
          <div class="embed-field ${field.inline === false ? 'full-width' : ''}">
            <div class="field-name">${field.name}</div>
            <div class="field-value">${field.value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderThumbnail() {
    if (!this.options.thumbnail) return '';
    return `<div class="thumbnail"><img src="${this.options.thumbnail}" alt=""></div>`;
  }

  _renderImage() {
    if (!this.options.image) return '';
    return `<div class="image-panel"><img src="${this.options.image}" alt=""></div>`;
  }

  _renderFooter() {
    if (!this.options.footer || (!this.options.footer.text && !this.options.footer.timestamp)) return '';

    return `
      <div class="embed-footer">
        <div class="footer-text">${this.options.footer.text || ''}</div>
        ${this.options.footer.timestamp ? `<div class="footer-timestamp">${new Date().toLocaleString()}</div>` : ''}
      </div>
    `;
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'discord-embed-styles';
    style.textContent = `
      .discord-embed {
          background: #36393f;
          padding: 16px;
          border-radius: 4px;
          position: relative;
          color: #dcddde;
          border-left: 6px solid #5865F2;
          margin: 10px 0;
          width: 100%;
          max-width: 520px;
          box-sizing: border-box;
      }

      .discord-embed .left-border {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 6px;
          background-color: #5865F2;
      }

      .discord-embed .embed-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .discord-embed .author-section {
          display: flex;
          align-items: center;
          gap: 8px;
      }

      .discord-embed .author-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          overflow: hidden;
      }

      .discord-embed .author-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }

      .discord-embed .author-name {
          font-size: 14px;
          color: white;
      }

      .discord-embed .embed-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          text-align: left;
          margin-top: 5px;
          max-width: 375px;
      }

      .discord-embed .embed-description {
          font-size: 14px;
          text-align: left;
          margin-top: 5px;
          margin-bottom: 5px;
          max-width: 375px;
      }

      .discord-embed .thumbnail {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 80px;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
      }

      .discord-embed .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }

      .discord-embed .image-panel img {
          max-width: 100%;
          border-radius: 4px;
      }

      .discord-embed .fields-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 5px 0;
      }

      .discord-embed .embed-field {
          background: #2f3136;
          padding: 10px;
          border-radius: 4px;
          width: calc(33.33% - 5.33px);
      }

      .discord-embed .embed-field.full-width {
          width: 100%;
      }

      .discord-embed .field-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
      }

      .discord-embed .field-value {
          font-size: 14px;
      }

      .discord-embed .embed-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 12px;
          color: #b9bbbe;
      }
    `;

    document.head.appendChild(style);
  }

  update(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (this.element) {
      this.element.remove();
      this.render();
    }
  }

  setColor(color) {
    this.options.color = color;
    this.element.style.borderLeftColor = color;
    const leftBorder = this.element.querySelector('.left-border');
    if (leftBorder) {
      leftBorder.style.backgroundColor = color;
    }
  }

  toJSON() {
    const embed = {
      title: this.options.title || undefined,
      description: this.options.description || undefined,
      color: this.options.color ? parseInt(this.options.color.replace('#', ''), 16) : undefined,
      author: this.options.author && this.options.author.name ? {
        name: this.options.author.name,
        icon_url: this.options.author.iconUrl
      } : undefined,
      thumbnail: this.options.thumbnail ? { url: this.options.thumbnail } : undefined,
      image: this.options.image ? { url: this.options.image } : undefined,
      fields: this.options.fields && this.options.fields.length > 0 ?
        this.options.fields.map(field => ({
          name: field.name,
          value: field.value,
          inline: field.inline !== false
        })) : undefined,
      footer: this.options.footer && (this.options.footer.text || this.options.footer.timestamp) ? {
        text: this.options.footer.text || '',
        icon_url: this.options.footer.iconUrl
      } : undefined,
      timestamp: this.options.footer && this.options.footer.timestamp ? new Date().toISOString() : undefined
    };

    Object.keys(embed).forEach(key => {
      if (embed[key] === undefined) delete embed[key];
    });

    return embed;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EZEmbed;
} else {
  window.EZEmbed = EZEmbed;
}
