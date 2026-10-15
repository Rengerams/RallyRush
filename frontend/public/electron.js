// electron-builder uses the Create React App preset and expects this file at build/electron.js.
// CRA copies files from public/ into build/, then this entry loads the desktop main process.
require("../desktop/main.cjs");
