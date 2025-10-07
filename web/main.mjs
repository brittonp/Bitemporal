// main.mjs
import './style.css'
import { GridResizable } from './GridResizeable.mjs'
import { DataManager } from './DataManager.mjs'
import { Config } from './Config.mjs'
import { JsonTable } from './JsonTable.mjs'
import { BitemporalChart } from './BitemporalChart.mjs'
import { DialogSql } from './DialogSql.mjs'
import { DialogUpdate } from './DialogUpdate.mjs'

//Wait for the page to load before initializing the app
window.addEventListener('load', async (event) => {
  // Make the grid resizable
  const resizable = new GridResizable()
  document
    .querySelectorAll('.divider-vertical')
    .forEach((div, i) => resizable.makeVerticalDivider(div, i * 2 + 1))
  document
    .querySelectorAll('.divider-horizontal')
    .forEach((div, i) => resizable.makeHorizontalDivider(div, i * 2 + 1))

  // Use Config class to load configuration
  const config = new Config()
  const configData = await config.loadConfig()

  configData.deptId = 10 // Default department
  configData.empId = 100 // Default employee

  // Intialise DataManager
  const dataManager = new DataManager(configData)
  const cmds = await dataManager.getCmds()

  // Initiate Dialogs
  const sqlDialog = new DialogSql('Sql')
  const updateDialog = new DialogUpdate('Update Commands', {
    dataManager: dataManager,
    cmds: cmds,
  })

  // Add BitemporalChart to display department data
  const deptChartContainer = document.getElementById('panelDeptPlot')
  const deptChart = new BitemporalChart(deptChartContainer, dataManager, {
    dataset: 'Department',
    title: `Department ${configData.deptId}`,
  })

  // Add BitemporalChart to display employee data
  const empChartContainer = document.getElementById('panelEmpPlot')
  const empChart = new BitemporalChart(empChartContainer, dataManager, {
    dataset: 'Employee',
    title: `Employee ${configData.empId}`,
  })

  // Add JsonTable to display department data
  const deptTableContainer = document.getElementById('panel2')
  const deptJsonTable = new JsonTable(deptTableContainer, dataManager, {
    dataset: 'Department',
    title: `Department ${configData.deptId}`,
    sqlDialog: sqlDialog,
  })

  // Add JsonTable to display employee data
  const empTableContainer = document.getElementById('panel3')
  const empJsonTable = new JsonTable(empTableContainer, dataManager, {
    dataset: 'Employee',
    title: `Employee ${configData.empId}`,
    sqlDialog: sqlDialog,
  })

  // Add JsonTable to display employee data
  const queryTableContainer = document.getElementById('panel4')
  const queryJsonTable = new JsonTable(queryTableContainer, dataManager, {
    dataset: 'Query',
    title: 'Query Data',
    sqlDialog: sqlDialog,
    ignoreHover: true,
  })

  // Initial data load
  await dataManager.loadData()

  // Add button to reset data
  const resetButton = document.getElementById('resetButton')
  resetButton.addEventListener('click', async () => {
    await dataManager.resetData()
  })

  // Dynamically create buttons for each update command
  const buttonContainer = document.createElement('div')
  buttonContainer.id = 'updateCmdButtons'
  Object.entries(cmds.UpdateCmds).forEach(([key, value]) => {
    const button = document.createElement('button')
    button.textContent = key
    button.id = `Update${key}Button`
    button.title = value.description
    buttonContainer.appendChild(button)
    button.addEventListener('click', async () => {
      //await dataManager.updateData(key);
      updateDialog.open(key)
    })
  })
  document.querySelector('.centre-buttons').appendChild(buttonContainer)

  // Add button to refresh data
  const refreshButton = document.getElementById('refreshButton')
  refreshButton.addEventListener('click', async () => {
    await dataManager.loadData()
  })
})
