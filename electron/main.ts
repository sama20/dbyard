import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { Client as SSHClient } from 'ssh2';
import axios from 'axios';

const isDev = process.argv.includes('--dev');

let mainWindow: BrowserWindow;

// MySQL Connection Management
interface ConnectionConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database?: string;
}

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

// Create SSH Tunnel
const createSSHTunnel = async (sshConfig: SSHConfig, dbConfig: ConnectionConfig): Promise<any> => {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();

    ssh.on('ready', () => {
      ssh.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err: any, stream: any) => {
        if (err) {
          ssh.end();
          reject(err);
          return;
        }
        resolve({ stream, ssh, config: { ...dbConfig, stream } });
      });
    });

    ssh.on('error', reject);

    const connectConfig: any = {
      host: sshConfig.host,
      port: sshConfig.port,
      username: sshConfig.username
    };

    if (sshConfig.privateKey) {
      connectConfig.privateKey = sshConfig.privateKey;
    } else {
      connectConfig.password = sshConfig.password;
    }

    ssh.connect(connectConfig);
  });
};

// IPC Handlers for Database Operations
ipcMain.handle('test-connection', async (event, config) => {
  let connection: any;
  let sshClient: SSHClient | null = null;

  try {
    const dbConfig: ConnectionConfig = {
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || undefined,
      database: config.database || undefined,
    };

    if (config.sshConfig && config.sshConfig.host && config.sshConfig.username) {
      const tunnel = await createSSHTunnel(config.sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    await connection.connect();
    
    return { success: true, message: 'Connection successful!' };
  } catch (error: any) {
    let errorMessage = 'Connection failed';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Could not connect to MySQL at ${config.host}:${config.port}. Please verify that MySQL is running.`;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Access denied. Please check your username and password.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = `Database '${config.database}' does not exist.`;
    } else {
      errorMessage = error.message || 'Connection failed';
    }
    
    return { success: false, message: errorMessage };
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

ipcMain.handle('get-databases', async (event, config) => {
  let connection: any;
  let sshClient: SSHClient | null = null;

  try {
    const dbConfig: ConnectionConfig = {
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || undefined,
    };

    if (config.sshConfig && config.sshConfig.host && config.sshConfig.username) {
      const tunnel = await createSSHTunnel(config.sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const [rows] = await connection.query('SHOW DATABASES');
    return (rows as any[]).map((row: any) => row.Database);
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

ipcMain.handle('get-tables', async (event, config) => {
  let connection: any;
  let sshClient: SSHClient | null = null;

  try {
    const dbConfig: ConnectionConfig = {
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || undefined,
      database: config.database,
    };

    if (config.sshConfig && config.sshConfig.host && config.sshConfig.username) {
      const tunnel = await createSSHTunnel(config.sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const [rows] = await connection.query('SHOW TABLES');
    return (rows as any[]).map((row: any) => Object.values(row)[0]);
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

ipcMain.handle('execute-query', async (event, query, config) => {
  let connection: any;
  let sshClient: SSHClient | null = null;
  const startTime = Date.now();

  try {
    const dbConfig: ConnectionConfig = {
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || undefined,
      database: config.database,
    };

    if (config.sshConfig && config.sshConfig.host && config.sshConfig.username) {
      const tunnel = await createSSHTunnel(config.sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const [rows, fields] = await connection.query(query);
    const executionTime = Date.now() - startTime;
    
    return {
      rows: Array.isArray(rows) ? rows : [],
      fields: fields || [],
      executionTime,
      rowsAffected: Array.isArray(rows) ? rows.length : (rows as any)?.affectedRows || 0
    };
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

// GitHub API Handlers (for Copilot integration)
ipcMain.handle('github-auth', async (event, authData) => {
  try {
    const response = await axios.post('https://github.com/login/device/code', authData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
});

ipcMain.handle('github-token', async (event, tokenData) => {
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', tokenData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
});

// Window Management
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    title: 'DByard - MySQL Database Manager',
    // Icon will be set if available, otherwise use default
    ...(process.platform !== 'darwin' && {
      icon: path.join(__dirname, '../assets/icon.png')
    }),
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: false // Keep menu bar visible
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    app.quit();
  });
};

// Custom Menu Configuration
const createMenu = () => {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // You can emit an event to the renderer to show connection modal
            mainWindow.webContents.send('new-connection');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('show-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'DByard',
      submenu: [
        {
          label: 'About DByard',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DByard',
              message: 'DByard',
              detail: 'A powerful MySQL database management tool.\n\nVersion 1.0.0'
            });
          }
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  } else {
    // Add About to Help menu for Windows/Linux
    template.push({
      label: 'Help',
      submenu: [
        {
          label: 'About DByard',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DByard',
              message: 'DByard',
              detail: 'A powerful MySQL database management tool.\n\nVersion 1.0.0'
            });
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// App Events
app.whenReady().then(() => {
  createWindow();
  createMenu(); // Set custom menu
  
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

// Security
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

export {};
