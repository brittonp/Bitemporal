import { Dialog } from './Dialog.mjs'

export class DialogSql extends Dialog {
  constructor(title, opts) {
    super(title, opts)

    // Define the content area
    this.contentSql = document.createElement('pre')
    this.contentSql.style.whiteSpace = 'pre-wrap'
    this.dialogContent.append(this.contentSql)
  }

  open(cmd) {
    this.contentSql.textContent = cmd
    super.open()
  }
}
