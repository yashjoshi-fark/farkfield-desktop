const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const crypto = require('node:crypto');
const ORIGIN = 'https://farkfield.vercel.app';
let win;
let signingIn = false;
const allowed = (value) => { try { return new URL(value).origin === ORIGIN; } catch { return false; } };
const external = (value) => { try { const u = new URL(value); if (['https:', 'mailto:'].includes(u.protocol)) void shell.openExternal(u.href); } catch {} };

app.enableSandbox();
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    win = new BrowserWindow({ width: 1440, height: 960, minWidth: 850, minHeight: 650, title: 'Farkfield', backgroundColor: '#0f1113',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), partition: 'persist:farkfield', nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
    win.setMenuBarVisibility(false);
    win.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' }; });
    win.webContents.on('will-navigate', (event, url) => { if (!allowed(url)) { event.preventDefault(); external(url); } });
    win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    win.webContents.on('did-fail-load', (_event, code, _description, _url, mainFrame) => {
      if (mainFrame && code !== -3) dialog.showMessageBox(win, { type: 'error', message: 'Could not connect to Farkfield', detail: 'Check your internet connection and restart the app.' });
    });
    void win.loadURL(ORIGIN);
  });
  ipcMain.handle('farkfield:sign-in', async (event) => {
    if (!win || event.sender !== win.webContents || !allowed(event.senderFrame.url)) throw new Error('Invalid sign-in request');
    if (signingIn) throw new Error('Sign-in is already open in your browser.');
    signingIn = true;
    try {
      const verifier = crypto.randomBytes(32).toString('base64url');
      const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
      const start = await fetch(`${ORIGIN}/api/desktop/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge }), signal: AbortSignal.timeout(15000) });
      if (!start.ok) throw new Error('Desktop sign-in is temporarily unavailable.');
      const { ticket } = await start.json();
      await shell.openExternal(`${ORIGIN}/desktop-connect?ticket=${encodeURIComponent(ticket)}`);
      const deadline = Date.now() + 5 * 60000;
      while (Date.now() < deadline && !win.isDestroyed()) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const response = await fetch(`${ORIGIN}/api/desktop/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket, verifier }), signal: AbortSignal.timeout(15000) });
        if (response.status === 202) continue;
        if (!response.ok) throw new Error('Sign-in expired. Please try again.');
        const cookie = response.headers.get('set-cookie')?.match(/ff_session=([^;]+)/)?.[1];
        if (!cookie) throw new Error('Desktop session was not returned.');
        await win.webContents.session.cookies.set({ url: ORIGIN, name: 'ff_session', value: cookie, secure: true, httpOnly: true, sameSite: 'lax', expirationDate: Math.floor(Date.now() / 1000) + 30 * 86400 });
        await win.webContents.session.cookies.flushStore();
        await win.loadURL(ORIGIN);
        win.focus();
        return;
      }
      throw new Error('Sign-in timed out. Please try again.');
    } finally { signingIn = false; }
  });
  app.on('window-all-closed', () => app.quit());
}
