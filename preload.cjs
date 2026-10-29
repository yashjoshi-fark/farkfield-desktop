const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('farkfieldDesktop', Object.freeze({
  signIn: () => ipcRenderer.invoke('farkfield:sign-in'),
  version: '0.1.1',
}));
