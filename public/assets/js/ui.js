/* ===== UI Components Library ===== */

// Toast Notification System
class Toast {
  constructor() {
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this._getIcon(type)}</span>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    if (duration > 0) {
      const progress = toast.querySelector('.toast-progress');
      progress.style.animation = `slideOut ${duration}ms linear forwards`;
      setTimeout(() => toast.remove(), duration);
    }
  }

  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }

  _getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  }
}

// Modal System
class Modal {
  constructor(title, content, options = {}) {
    this.title = title;
    this.content = content;
    this.options = {
      size: 'medium', // small, medium, large
      showFooter: true,
      buttons: [
        { text: 'Close', type: 'secondary', action: () => this.close() }
      ],
      ...options
    };
    this.overlay = null;
    this.modal = null;
  }

  show() {
    this._create();
    this.overlay.classList.add('show');
  }

  close() {
    this.overlay.classList.remove('show');
    setTimeout(() => {
      if (this.overlay) this.overlay.remove();
    }, 300);
  }

  _create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';

    // Create modal
    this.modal = document.createElement('div');
    this.modal.className = 'modal';

    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="modal-title">${this.title}</div>
      <button class="modal-close">&times;</button>
    `;
    header.querySelector('.modal-close').addEventListener('click', () => this.close());

    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else {
      body.appendChild(this.content);
    }

    this.modal.appendChild(header);
    this.modal.appendChild(body);

    // Create footer if needed
    if (this.options.showFooter && this.options.buttons.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      this.options.buttons.forEach(btn => {
        const btnEl = document.createElement('button');
        btnEl.className = `btn ${btn.type === 'secondary' ? 'btn-outline' : ''}`;
        btnEl.textContent = btn.text;
        btnEl.addEventListener('click', () => {
          if (btn.action) btn.action();
        });
        footer.appendChild(btnEl);
      });

      this.modal.appendChild(footer);
    }

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }
}

// Confirmation Dialog
class ConfirmDialog {
  constructor(title, message, options = {}) {
    this.title = title;
    this.message = message;
    this.options = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      dangerMode: false,
      ...options
    };
  }

  show() {
    return new Promise((resolve) => {
      const content = document.createElement('div');
      content.innerHTML = `<p style="color: #A0AEC0; font-size: 14px; margin-bottom: 0;">${this.message}</p>`;

      const modal = new Modal(this.title, content, {
        buttons: [
          {
            text: this.options.cancelText,
            type: 'secondary',
            action: () => {
              modal.close();
              resolve(false);
            }
          },
          {
            text: this.options.confirmText,
            type: this.options.dangerMode ? 'danger' : 'primary',
            action: () => {
              modal.close();
              resolve(true);
            }
          }
        ]
      });

      modal.show();
    });
  }
}

// Loading Spinner
class LoadingSpinner {
  constructor(message = 'Loading...') {
    this.message = message;
    this.overlay = null;
  }

  show() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay show';
    this.overlay.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
        <div style="width: 50px; height: 50px; border: 3px solid rgba(199, 125, 255, 0.2); border-top-color: #C77DFF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="color: #E0E1FF; font-size: 14px;">${this.message}</div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    // Add spin animation if not exists
    if (!document.querySelector('style[data-spinner]')) {
      const style = document.createElement('style');
      style.setAttribute('data-spinner', 'true');
      style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }

  hide() {
    if (this.overlay) this.overlay.remove();
  }
}

// Global instances
window.toast = new Toast();
