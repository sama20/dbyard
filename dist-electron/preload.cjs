"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose the API to the renderer process
const electronAPI = {
    testConnection: (config) => electron_1.ipcRenderer.invoke('test-connection', config),
    getDatabases: (config) => electron_1.ipcRenderer.invoke('get-databases', config),
    getTables: (config) => electron_1.ipcRenderer.invoke('get-tables', config),
    executeQuery: (query, config) => electron_1.ipcRenderer.invoke('execute-query', query, config),
    githubAuth: (authData) => electron_1.ipcRenderer.invoke('github-auth', authData),
    githubToken: (tokenData) => electron_1.ipcRenderer.invoke('github-token', tokenData),
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('show-save-dialog', options),
};
// Expose the API to the window object
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
