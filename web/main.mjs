// main.mjs
import './style.css';
import { Splash } from './components/Splash.mjs';
import { GridResizable } from './components/GridResizeable.mjs';
import { DataManager } from './components/DataManager.mjs';
import { Config } from './components/Config.mjs';
import { Table } from './components/Table.mjs';
import { Chart } from './components/Chart.mjs';
import { DialogSql } from './components/DialogSql.mjs';
import { DialogUpdate } from './components/DialogUpdate.mjs';
import { DropDownMenu } from './components/DropDownMenu.mjs';

//Wait for the page to load before initializing the app
window.addEventListener('load', async (event) => {
  const splash = new Splash();
  splash.showSplash('Loading Bitemporal App...');

  // Use Config class to load configuration
  const config = new Config();
  const configData = await config.loadConfig();

  configData.deptId = 10; // Default department
  configData.empId = 100; // Default employee

  // Intialise DataManager
  const dataManager = new DataManager(configData);

  // Create Dialogs
  const sqlDialog = new DialogSql('Sql');

  const cmds = await dataManager.getCmds();
  const updateDialog = new DialogUpdate('Update Commands', {
    dataManager: dataManager,
    cmds: cmds,
  });

  // Make the grids resizable
  const resizable = new GridResizable();

  // manage tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active states
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      // Add active state to clicked button + target content
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Add Chart to display department data
  const deptChartContainer = document.getElementById('deptChartContainer');
  new Chart(deptChartContainer, dataManager, {
    dataset: 'Department',
    title: `Department ${configData.deptId}`,
  });

  // Add Chart to display employee data
  const empChartContainer = document.getElementById('empChartContainer');
  new Chart(empChartContainer, dataManager, {
    dataset: 'Employee',
    title: `Employee ${configData.empId}`,
  });

  // Add Table to display department data
  const deptTableContainer = document.getElementById('deptTableContainer');
  new Table(deptTableContainer, dataManager, {
    dataset: 'Department',
    title: `Department ${configData.deptId}`,
    sqlDialog: sqlDialog,
  });

  // Add Table to display employee data
  const empTableContainer = document.getElementById('empTableContainer');
  new Table(empTableContainer, dataManager, {
    dataset: 'Employee',
    title: `Employee ${configData.empId}`,
    sqlDialog: sqlDialog,
  });

  // Add Table to display query data
  const queryTableContainer = document.getElementById('queryTableContainer');
  new Table(queryTableContainer, dataManager, {
    dataset: 'Query',
    title: 'Query Data',
    sqlDialog: sqlDialog,
    ignoreHover: true,
    initialMessage:
      'Click on a chart to view the data effective for that point in time.',
  });

  // Create a dropdown menu for the update commands
  const headerCenter = document.querySelector('.header .centre-section');
  new DropDownMenu(headerCenter, {
    label: 'Modify data',
    loadItems: async (self) => {
      Object.entries(cmds.UpdateCmds).forEach(([key, value]) => {
        const menuItem = document.createElement('li');
        const menuLink = document.createElement('a');
        menuLink.textContent = value.title;
        menuLink.href = '#';
        menuLink.title = value.description;
        menuLink.addEventListener('click', async (e) => {
          e.preventDefault();
          self.dropdownMenu.classList.remove('show');
          updateDialog.open(key);
        });
        menuItem.appendChild(menuLink);
        self.dropdownMenu.appendChild(menuItem);
      });
    },
  });

  // Add button to refresh screen
  const refreshButton = document.createElement('div');
  refreshButton.textContent = '🔄';
  refreshButton.className = 'unstyled-link';
  refreshButton.title = 'Requery the data from the database';
  refreshButton.addEventListener('click', async () => {
    await dataManager.loadData();
  });
  document.querySelector('.header .right-section').prepend(refreshButton);

  //Add button to reset data
  const resetButton = document.createElement('div');
  resetButton.textContent = '♻️';
  resetButton.className = 'unstyled-link';
  resetButton.title = 'Reset the data in the database';
  resetButton.addEventListener('click', async () => {
    await dataManager.resetData();
  });
  document.querySelector('.header .right-section').prepend(resetButton);

  // Initial data load, then hide splash
  try {
    await dataManager.loadData();

    // hide splash when ready
    splash.hideSplash();

    // bit ugly but need to ensure splash is removed before showing app
    document.querySelector('app').classList.remove('hidden');
  } catch (err) {
    splash.updateMessage(
      'There is a delay in connecting, please refresh your browser and try again...'
    );
    return;
  }
});
