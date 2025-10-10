// splash.mjs
export class Splash {
  constructor(config) {
    this.config = config;
    this.showTimer = null;
    this.splashEl = null;
    this.splashContentEl = null;
  }

  showSplash(message = 'Connecting...', delay = 500) {
    this.showTimer = setTimeout(() => {
      this.splashEl = document.createElement('div');
      this.splashEl.id = 'splash-screen';

      this.splashContentEl = document.createElement('div');
      this.splashContentEl.id = 'splash-content';
      this.splashContentEl.innerHTML = `
        <div class="message">${message}</div>
        <div class="spinner"></div>
        `;

      this.splashEl.appendChild(this.splashContentEl);
      document.body.appendChild(this.splashEl);

      // Step 1: Ensure element is rendered at opacity:0
      this.splashEl.classList.remove('visible');

      // Step 2: Wait one animation frame, then trigger fade-in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.splashEl.classList.add('visible');
        });
      });
    }, delay);
  }

  hideSplash() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    if (this.splashEl) {
      this.splashEl.classList.remove('visible'); // triggers fade-out
      this.splashEl.addEventListener(
        'transitionend',
        () => {
          if (this.splashEl?.parentNode) {
            this.splashEl.parentNode.removeChild(this.splashEl);
            this.splashEl = null;
          }
        },
        { once: true }
      );
    }
  }

  updateMessage(message) {
    if (this.splashContentEl) {
      this.splashContentEl.querySelector('.message').textContent = message;
    }
  }
}
