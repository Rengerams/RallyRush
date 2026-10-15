const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const url = "http://127.0.0.1:3000";
const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";

const server = spawn(npm, ["start"], {
  cwd: root,
  env: { ...process.env, BROWSER: "none", CI: "true", HOST: "127.0.0.1", PORT: "3000" },
  stdio: "inherit",
  shell: isWindows,
});

let desktop;
let shuttingDown = false;

function stop() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (desktop && desktop.exitCode === null) desktop.kill();
  if (server && server.exitCode === null) server.kill();
}

async function serverReady() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("The frontend development server stopped before it was ready.");
    const ready = await new Promise((resolve) => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 500);
      });
      request.setTimeout(1000, () => { request.destroy(); resolve(false); });
      request.on("error", () => resolve(false));
    });
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for the frontend at " + url);
}

async function start() {
  try {
    await serverReady();
    const electronCli = require.resolve("electron/cli.js");
    desktop = spawn(process.execPath, [electronCli, "."], {
      cwd: root,
      env: { ...process.env, DESKTOP_START_URL: url },
      stdio: "inherit",
    });
    desktop.on("exit", (code) => {
      stop();
      process.exitCode = code || 0;
    });
    desktop.on("error", (error) => {
      console.error("Could not start the desktop app:", error.message);
      stop();
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => { stop(); process.exit(130); });
process.on("SIGTERM", () => { stop(); process.exit(143); });
server.on("error", (error) => {
  console.error("Could not start the development server:", error.message);
  stop();
  process.exitCode = 1;
});
start();
