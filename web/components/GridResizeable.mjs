// components/GridResizeable.mjs
import './GridResizeable.css';

export class GridResizable {
  constructor(parent, config = {}) {
    this.parent = parent ?? document;
    this.minSize = config.minSize ?? 50;

    this.parent
      .querySelectorAll('.resize-vertical')
      .forEach((div, i) => this.makeVerticalDivider(div, i * 2 + 1));
    this.parent
      .querySelectorAll('.resize-horizontal')
      .forEach((div, i) => this.makeHorizontalDivider(div, i * 2 + 1));
  }

  makeVerticalDivider(divider, colIndex) {
    let startX = 0;
    let startWidths = [];
    const parent = divider.parentElement;

    const onDrag = (e) => {
      e.preventDefault();
      const currentX = e.clientX || e.touches[0].clientX;
      const delta = currentX - startX;

      let leftWidth = startWidths[0] + delta;
      let rightWidth = startWidths[1] - delta;

      if (leftWidth < this.minSize || rightWidth < this.minSize) return;

      const cols = getComputedStyle(parent).gridTemplateColumns.split(' ');
      cols[colIndex - 1] = leftWidth + 'px';
      cols[colIndex + 1] = rightWidth + 'px';
      parent.style.gridTemplateColumns = cols.join(' ');
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDrag);
    };

    const startDrag = (e) => {
      startX = e.clientX || e.touches[0].clientX;
      const cols = getComputedStyle(parent)
        .gridTemplateColumns.split(' ')
        .map((c) => parseFloat(c));
      startWidths = [cols[colIndex - 1], cols[colIndex + 1]];

      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', onDrag, { passive: false });
      window.addEventListener('touchend', stopDrag);
    };

    divider.addEventListener('mousedown', startDrag);
    divider.addEventListener('touchstart', startDrag);
  }

  makeHorizontalDivider(divider, rowIndex) {
    let startY = 0;
    let startHeights = [];
    const parent = divider.parentElement;

    const onDrag = (e) => {
      e.preventDefault();
      const currentY = e.clientY || e.touches[0].clientY;
      const delta = currentY - startY;

      let topHeight = startHeights[0] + delta;
      let bottomHeight = startHeights[1] - delta;

      if (topHeight < this.minSize || bottomHeight < this.minSize) return;

      const rows = getComputedStyle(parent).gridTemplateRows.split(' ');
      rows[rowIndex - 1] = topHeight + 'px';
      rows[rowIndex + 1] = bottomHeight + 'px';
      parent.style.gridTemplateRows = rows.join(' ');
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDrag);
    };

    const startDrag = (e) => {
      startY = e.clientY || e.touches[0].clientY;
      const rows = getComputedStyle(parent)
        .gridTemplateRows.split(' ')
        .map((r) => parseFloat(r));
      startHeights = [rows[rowIndex - 1], rows[rowIndex + 1]];

      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', onDrag, { passive: false });
      window.addEventListener('touchend', stopDrag);
    };

    divider.addEventListener('mousedown', startDrag);
    divider.addEventListener('touchstart', startDrag);
  }
}
