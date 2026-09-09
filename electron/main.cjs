const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// const sql = require('mssql'); // Uncomment when mssql is installed

// Global reference to the window object
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "SambaPOS Clone - Site Entegre",
    icon: path.join(__dirname, '../client/public/favicon.png') 
  });

  // Load the React app
  // In development, load from localhost
  // In production, load from file system
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5000/desktop';
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in dev mode
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  connectToSqlServer();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- SQL Server Connection Logic ---
async function connectToSqlServer() {
  console.log("Attempting to connect to SQL Server...");
  // const config = {
  //   user: 'sa',
  //   password: 'yourStrong(!)Password',
  //   server: 'localhost', 
  //   database: 'SambaPOS_DB',
  //   options: {
  //     encrypt: true, // Use this if you're on Windows Azure
  //     trustServerCertificate: true // Change to true for local dev / self-signed certs
  //   }
  // };

  try {
    // await sql.connect(config);
    console.log("Connected to SQL Server successfully (Mock).");
  } catch (err) {
    console.error("SQL Server connection failed:", err);
  }
}

// --- IPC Handlers ---
ipcMain.handle('check-license', async (event, arg) => {
  // In a real app, this might check a local file or call the Python API directly via axios
  // For now, we rely on the Renderer to call the API via fetch
  return { status: 'valid', source: 'main-process' };
});
