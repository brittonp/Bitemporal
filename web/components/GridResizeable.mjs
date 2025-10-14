// components/GridResizeable.mjs
import './GridResizeable.css';

const Orientation = Object.freeze({
  HORIZONTAL: 0,
  VERTICAL: 1,
});

export class GridResizable {
  constructor(config = {}) {
    this.minSize = config.minSize ?? 50;
    this.dividerWidth = config.dividerWidth ?? '4px';

    // Configure all grids with the resizable class
    document
      .querySelectorAll('.grid.resizable.vertical')
      .forEach((grid) => this.#configureVertical(grid));

    document
      .querySelectorAll('.grid.resizable.horizontal')
      .forEach((grid) => this.#configureHorizontal(grid));
  }

  #configureVertical(grid) {
    const panels = Array.from(grid.children);

    // Add dividers between panels
    for (let i = 0; i < panels.length - 1; i++) {
      const index = i * 2 + 1;
      const divider = new ResizableDivider(grid, index, Orientation.VERTICAL);
    }

    // Initialise grid template rows
    grid.style.gridTemplateRows = panels
      .map(() => '1fr')
      .join(` ${this.dividerWidth} `);
  }

  #configureHorizontal(grid) {
    const panels = Array.from(grid.children);

    // Add dividers between panels
    for (let i = 0; i < panels.length - 1; i++) {
      const index = i * 2 + 1;
      const divider = new ResizableDivider(grid, index, Orientation.HORIZONTAL);
      console.log(divider);
    }

    // Initialise grid template columns
    grid.style.gridTemplateColumns = panels
      .map(() => '1fr')
      .join(` ${this.dividerWidth} `);
  }
}

class ResizableDivider {
  // Private fields for event handlers
  #startDrag = {};
  #onDrag = {};
  #startY = 0;
  #startHeights = [];
  #startX = 0;
  #startWidths = [];

  constructor(parent, index, orientation, config = {}) {
    this.parent = parent;
    this.index = index;
    let className;

    switch (orientation) {
      case Orientation.VERTICAL:
        this.#startDrag = this.#startDragVertical;
        this.#onDrag = this.#onDragVertical;
        className = 'divider resize-horizontal';
        break;
      case Orientation.HORIZONTAL:
        this.#startDrag = this.#startDragHorizontal;
        this.#onDrag = this.#onDragHorizontal;
        className = 'divider resize-vertical';
        break;
      default:
        throw new Error('Unsupported orientation');
    }

    const divider = document.createElement('div');
    divider.className = className;

    divider.addEventListener('mousedown', this.#startDrag);
    divider.addEventListener('touchstart', this.#startDrag);

    // Insert after the current child
    this.parent.insertBefore(divider, parent.children[index]);

    this.divider = divider;
  }

  #stopDrag = () => {
    window.removeEventListener('mousemove', this.#onDrag);
    window.removeEventListener('mouseup', this.#stopDrag);
    window.removeEventListener('touchmove', this.#onDrag);
    window.removeEventListener('touchend', this.#stopDrag);
  };

  #startDragVertical = (e) => {
    this.#startY = e.clientY || e.touches[0].clientY;
    const rows = getComputedStyle(this.parent)
      .gridTemplateRows.split(' ')
      .map((r) => parseFloat(r));
    this.#startHeights = [rows[this.index - 1], rows[this.index + 1]];

    window.addEventListener('mousemove', this.#onDrag);
    window.addEventListener('mouseup', this.#stopDrag);
    window.addEventListener('touchmove', this.#onDrag, {
      passive: false,
    });
    window.addEventListener('touchend', this.#stopDrag);
  };

  #onDragVertical = (e) => {
    e.preventDefault();
    const currentY = e.clientY || e.touches[0].clientY;
    const delta = currentY - this.#startY;

    let topHeight = this.#startHeights[0] + delta;
    let bottomHeight = this.#startHeights[1] - delta;

    if (topHeight < this.minSize || bottomHeight < this.minSize) return;

    const rows = getComputedStyle(this.parent).gridTemplateRows.split(' ');

    rows[this.index - 1] = topHeight + 'px';
    rows[this.index + 1] = bottomHeight + 'px';
    this.parent.style.gridTemplateRows = rows.join(' ');
  };

  #startDragHorizontal = (e) => {
    this.#startX = e.clientX || e.touches[0].clientX;
    const cols = getComputedStyle(this.parent)
      .gridTemplateColumns.split(' ')
      .map((c) => parseFloat(c));
    this.#startWidths = [cols[this.index - 1], cols[this.index + 1]];

    window.addEventListener('mousemove', this.#onDrag);
    window.addEventListener('mouseup', this.#stopDrag);
    window.addEventListener('touchmove', this.#onDrag, {
      passive: false,
    });
    window.addEventListener('touchend', this.#stopDrag);
  };

  #onDragHorizontal = (e) => {
    e.preventDefault();
    const currentX = e.clientX || e.touches[0].clientX;
    const delta = currentX - this.#startX;

    let leftWidth = this.#startWidths[0] + delta;
    let rightWidth = this.#startWidths[1] - delta;

    if (leftWidth < this.minSize || rightWidth < this.minSize) return;

    const cols = getComputedStyle(this.parent).gridTemplateColumns.split(' ');
    cols[this.index - 1] = leftWidth + 'px';
    cols[this.index + 1] = rightWidth + 'px';
    this.parent.style.gridTemplateColumns = cols.join(' ');
  };
}
