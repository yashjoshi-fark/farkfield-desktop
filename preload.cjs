const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('farkfieldDesktop', Object.freeze({
  signIn: () => ipcRenderer.invoke('farkfield:sign-in'),
  saveAsset: (asset) => ipcRenderer.invoke('farkfield:save-asset', asset),
  version: '0.1.3',
}));
