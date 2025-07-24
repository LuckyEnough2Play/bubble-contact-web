const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  screen,
  Menu
} = require('electron');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(app.getPath('userData'), 'contacts.json');

function loadContacts() {
  try {
    return JSON.parse(fs.readFileSync(dataPath));
  } catch (e) {
    return [];
  }
}

function saveContacts(contacts) {
  fs.writeFileSync(dataPath, JSON.stringify(contacts, null, 2));
}

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // Build a minimal application menu containing only the "View" menu.
  const isMac = process.platform === 'darwin';
  const menuTemplate = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  if (isMac) {
    menuTemplate.unshift({
      label: app.name,
      submenu: [{ role: 'quit' }]
    });
  }
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  ipcMain.handle('load-contacts', () => {
    return loadContacts();
  });

  ipcMain.on('save-contacts', (event, contacts) => {
    saveContacts(contacts);
  });

  ipcMain.handle('import-csv', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (canceled) return { canceled: true };
    const file = fs.readFileSync(filePaths[0], 'utf8');
    return { canceled: false, content: file };
  });

  ipcMain.handle('export-csv', async (event, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({ filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (canceled) return { canceled: true };
    fs.writeFileSync(filePath, data, 'utf8');
    return { canceled: false };
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
