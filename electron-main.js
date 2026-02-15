
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "GullyScore",
    icon: path.join(__dirname, 'dist', 'icon.png'), // Try to find icon in dist if moved there
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false // sometimes needed for local file loading issues in older electron versions, but generally keep true if possible. For local apps loading local resources it helps.
    },
    backgroundColor: '#f8fafc', // Matches slate-50
    autoHideMenuBar: true // Press Alt to show
  });

  // Point to the built React app in the dist folder
  const distIndex = path.join(__dirname, 'dist', 'index.html');

  if (fs.existsSync(distIndex)) {
    win.loadFile(distIndex);
  } else {
    // If dist doesn't exist, maybe we are in dev mode? 
    // You can uncomment this if you run 'npm run dev' and 'npm run electron' simultaneously
    // win.loadURL('http://localhost:5173'); 
    
    console.error("Error: 'dist/index.html' not found. Please run 'npm run build' before starting Electron.");
  }
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
