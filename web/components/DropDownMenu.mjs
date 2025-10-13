// DropDownMenu.mjs
import './DropDownMenu.css';

export class DropDownMenu {
  constructor(container, opts = {}) {
    this.container = container;
    this.label = opts.label || 'Menu';
    this.loadItems = opts.loadItems || (async () => {});

    // Create a dropdown menu for the update commands
    const dropDownContainer = document.createElement('div');
    dropDownContainer.className = 'dropdown';
    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'dropdown-btn';
    dropdownButton.textContent = `${this.label} ▾`;
    dropDownContainer.appendChild(dropdownButton);
    const dropdownMenu = document.createElement('ul');
    this.dropdownMenu = dropdownMenu;
    dropdownMenu.className = 'dropdown-menu';
    dropDownContainer.appendChild(dropdownMenu);
    dropdownButton.addEventListener('click', () => {
      dropdownMenu.classList.toggle('show');
    });
    // Close the dropdown if the user clicks outside of it
    window.addEventListener('click', (event) => {
      if (!event.target.matches('.dropdown-btn')) {
        if (dropdownMenu.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
        }
      }
    });

    if (opts.loadItems) {
      opts.loadItems(this);
    }

    this.container.appendChild(dropDownContainer);
  }
}
