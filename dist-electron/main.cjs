"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const mysql = __importStar(require("mysql2/promise"));
const ssh2_1 = require("ssh2");
const axios_1 = __importDefault(require("axios"));
const isDev = process.argv.includes('--dev');
let mainWindow;
// Create SSH Tunnel
const createSSHTunnel = async (sshConfig, dbConfig) => {
    return new Promise((resolve, reject) => {
        const ssh = new ssh2_1.Client();
        ssh.on('ready', () => {
            ssh.forwardOut('127.0.0.1', 0, dbConfig.host, dbConfig.port, (err, stream) => {
                if (err) {
                    ssh.end();
                    reject(err);
                    return;
                }
                resolve({ stream, ssh, config: { ...dbConfig, stream } });
            });
        });
        ssh.on('error', reject);
        const connectConfig = {
            host: sshConfig.host,
            port: sshConfig.port,
            username: sshConfig.username
        };
        if (sshConfig.privateKey) {
            connectConfig.privateKey = sshConfig.privateKey;
        }
        else {
            connectConfig.password = sshConfig.password;
        }
        ssh.connect(connectConfig);
    });
};
// IPC Handlers for Database Operations
electron_1.ipcMain.handle('test-connection', async (event, config) => {
    let connection;
    let sshClient = null;
    try {
        const dbConfig = {
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
        }
        else {
            connection = await mysql.createConnection(dbConfig);
        }
        await connection.connect();
        return { success: true, message: 'Connection successful!' };
    }
    catch (error) {
        let errorMessage = 'Connection failed';
        if (error.code === 'ECONNREFUSED') {
            errorMessage = `Could not connect to MySQL at ${config.host}:${config.port}. Please verify that MySQL is running.`;
        }
        else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage = 'Access denied. Please check your username and password.';
        }
        else if (error.code === 'ER_BAD_DB_ERROR') {
            errorMessage = `Database '${config.database}' does not exist.`;
        }
        else {
            errorMessage = error.message || 'Connection failed';
        }
        return { success: false, message: errorMessage };
    }
    finally {
        if (connection)
            await connection.end();
        if (sshClient)
            sshClient.end();
    }
});
electron_1.ipcMain.handle('get-databases', async (event, config) => {
    let connection;
    let sshClient = null;
    try {
        const dbConfig = {
            host: config.host,
            port: parseInt(config.port),
            user: config.username,
            password: config.password || undefined,
        };
        if (config.sshConfig && config.sshConfig.host && config.sshConfig.username) {
            const tunnel = await createSSHTunnel(config.sshConfig, dbConfig);
            connection = await mysql.createConnection(tunnel.config);
            sshClient = tunnel.ssh;
        }
        else {
            connection = await mysql.createConnection(dbConfig);
        }
        const [rows] = await connection.query('SHOW DATABASES');
        return rows.map((row) => row.Database);
    }
    catch (error) {
        throw new Error(error.message);
    }
    finally {
        if (connection)
            await connection.end();
        if (sshClient)
            sshClient.end();
    }
});
electron_1.ipcMain.handle('get-tables', async (event, config) => {
    let connection;
    let sshClient = null;
    try {
        const dbConfig = {
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
        }
        else {
            connection = await mysql.createConnection(dbConfig);
        }
        const [rows] = await connection.query('SHOW TABLES');
        return rows.map((row) => Object.values(row)[0]);
    }
    catch (error) {
        throw new Error(error.message);
    }
    finally {
        if (connection)
            await connection.end();
        if (sshClient)
            sshClient.end();
    }
});
electron_1.ipcMain.handle('execute-query', async (event, query, config) => {
    let connection;
    let sshClient = null;
    const startTime = Date.now();
    try {
        const dbConfig = {
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
        }
        else {
            connection = await mysql.createConnection(dbConfig);
        }
        const [rows, fields] = await connection.query(query);
        const executionTime = Date.now() - startTime;
        return {
            rows: Array.isArray(rows) ? rows : [],
            fields: fields || [],
            executionTime,
            rowsAffected: Array.isArray(rows) ? rows.length : rows?.affectedRows || 0
        };
    }
    catch (error) {
        throw new Error(error.message);
    }
    finally {
        if (connection)
            await connection.end();
        if (sshClient)
            sshClient.end();
    }
});
// GitHub API Handlers (for Copilot integration)
electron_1.ipcMain.handle('github-auth', async (event, authData) => {
    try {
        const response = await axios_1.default.post('https://github.com/login/device/code', authData);
        return response.data;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
electron_1.ipcMain.handle('github-token', async (event, tokenData) => {
    try {
        const response = await axios_1.default.post('https://github.com/login/oauth/access_token', tokenData);
        return response.data;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
// Window Management
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.on('closed', () => {
        electron_1.app.quit();
    });
};
// Custom Menu Configuration
const createMenu = () => {
    const template = [
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
                        electron_1.app.quit();
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
                        electron_1.dialog.showMessageBox(mainWindow, {
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
    }
    else {
        // Add About to Help menu for Windows/Linux
        template.push({
            label: 'Help',
            submenu: [
                {
                    label: 'About DByard',
                    click: () => {
                        electron_1.dialog.showMessageBox(mainWindow, {
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
// App Events
electron_1.app.whenReady().then(() => {
    createWindow();
    createMenu(); // Set custom menu
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
});
