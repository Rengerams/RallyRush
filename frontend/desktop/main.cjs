const path = require("node:path");
const { app, BrowserWindow, session, shell } = require("electron");
const { createContentSecurityPolicy } = require("./csp.cjs");

function applyContentSecurityPolicy() {
  const isDevelopment = Boolean(process.env.DESKTOP_START_URL);
  const policy = createContentSecurityPolicy({
    development: isDevelopment,
    nonce: process.env.DESKTOP_CSP_NONCE,
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [policy],
      },
    });
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: "#0B0E14",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      shell.openExternal(url).catch((error) => console.error("Could not open external link:", error));
    }
    return { action: "deny" };
  });

  if (process.env.DESKTOP_START_URL) {
    window.loadURL(process.env.DESKTOP_START_URL).catch((error) => console.error("Could not load desktop start URL:", error));
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html")).catch((error) => console.error("Could not load the app window:", error));
  }
}

app.whenReady().then(() => {
  applyContentSecurityPolicy();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error("Could not initialize the desktop app:", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
