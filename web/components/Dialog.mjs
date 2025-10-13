// dialog.mjs
import './Dialog.css';

export class Dialog {
  constructor(title, opts) {
    this.el = document.createElement('div');
    this.el.className = 'dialog-overlay';

    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'dialog-box';

    this.dialogHeader = document.createElement('div');
    this.dialogHeader.className = 'header';

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    this.dialogHeader.append(titleEl);

    // Add a copy button to the header
    const copyEl = document.createElement('button');
    copyEl.textContent = '📋Copy SQL';
    copyEl.addEventListener('click', () => this.#copySql());
    this.dialogHeader.append(copyEl);

    this.dialogBox.append(this.dialogHeader);

    this.dialogContent = document.createElement('div');
    this.dialogContent.className = 'content';
    this.dialogBox.append(this.dialogContent);

    this.dialogFooter = document.createElement('div');
    this.dialogFooter.className = 'footer';

    this.dialogFooterLeftButtons = document.createElement('div');
    this.dialogFooterLeftButtons.className = 'left-buttons';
    this.dialogFooter.append(this.dialogFooterLeftButtons);

    this.dialogFooterRightButtons = document.createElement('div');
    this.dialogFooterRightButtons.className = 'right-buttons';

    const dialogClose = document.createElement('button');
    dialogClose.textContent = 'Close';
    dialogClose.addEventListener('click', () => this.close());
    this.dialogFooterRightButtons.append(dialogClose);

    this.dialogFooter.append(this.dialogFooterRightButtons);

    this.dialogBox.append(this.dialogFooter);

    this.el.append(this.dialogBox);

    document.body.appendChild(this.el);
  }

  open() {
    //this.el.querySelector('.dialog-content').textContent = cmd;
    this.el.classList.add('open');
  }

  close() {
    this.el.classList.remove('open');
  }

  #copySql() {
    const sql = this.contentSql.textContent;
    navigator.clipboard
      .writeText(sql)
      .then(() => console.log('Copied to clipboard!'))
      .catch((err) => console.error('Copy failed:', err));
  }
}
