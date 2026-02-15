
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "GullyScore",
    icon: path.join(__dirname, 'icon.png'), // Placeholder for icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    backgroundColor: '#f8fafc' // Matches slate-50
  });

  // Load the local index.html file
  win.loadFile('index.html');

  // Remove the default menu bar for a cleaner "app" feel
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
