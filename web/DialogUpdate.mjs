import { Dialog } from './Dialog.mjs';

export class DialogUpdate extends Dialog {
  constructor(title, opts) {
    super(title, opts);

    this.cmds = opts.cmds;
    this.dataManager = opts.dataManager;

    // Define the content area
    this.contentDescription = document.createElement('div');
    this.dialogContent.append(this.contentDescription);
    this.contentSql = document.createElement('pre');
    this.contentSql.style.whiteSpace = 'pre-wrap';
    this.dialogContent.append(this.contentSql);
    this.contentExplanation = document.createElement('div');
    this.dialogContent.append(this.contentExplanation);

    // Add a execute button to the footer
    const executeBtn = document.createElement('button');
    executeBtn.textContent = 'Execute';
    executeBtn.addEventListener('click', async () => {
      await this.dataManager.updateData(this.cmd);
      this.close();
    });
    this.dialogFooterLeftButtons.append(executeBtn);
  }

  open(cmd) {
    this.cmd = cmd;
    const cmdObj = this.cmds.UpdateCmds[cmd];
    this.contentDescription.textContent =
      cmdObj.description || 'No description available';
    this.contentSql.textContent = cmdObj.sql || 'No command found';
    this.contentExplanation.innerHTML =
      cmdObj.explanation || 'No explanation available';
    super.open();
  }
}
