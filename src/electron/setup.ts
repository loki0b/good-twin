import { BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./utils.js";
import { writeGreenLeds, writeRedLeds, readPushButtons, readSwitches } from "./fpgaHandler.js";
import { startAp, stopAp, startDhcp, stopDhcp, scanNetworks, getClients } from "./wifiHandler.js";

function createWindow(appPath: string, isDev: boolean): BrowserWindow {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath()
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(appPath, "dist-react/index.html"));
  }

  return mainWindow;
}

function registerIpcHandlers() {
  ipcMain.handle("write-green-led-bus", (_, data) => writeGreenLeds(data));
  ipcMain.handle("write-red-led-bus", (_, data) => writeRedLeds(data));
  
  ipcMain.handle("start-ap", (_, ssid, channel, band, password) => startAp(ssid, channel, band, password));
  ipcMain.handle("stop-ap", () => stopAp());
  
  ipcMain.handle("start-dhcp", (_, captive) => startDhcp(captive));
  ipcMain.handle("stop-dhcp", () => stopDhcp());
  
  ipcMain.handle("scan-networks", () => scanNetworks());
  ipcMain.handle("get-clients", () => getClients());
}

function startFpgaPolling(mainWindow: BrowserWindow) {
  let lastButtonState = -1;
  setInterval(async () => {
    try {
      const currentState = await readPushButtons();
      if (currentState !== null && currentState !== lastButtonState) {
        lastButtonState = currentState;
        mainWindow.webContents.send("push-button-changed", currentState);
      }
    } catch (err) {}
  }, 50);

  let lastSwitchState = -1;
  setInterval(async () => {
    try {
      const currentState = await readSwitches();
      if (currentState !== null && currentState !== lastSwitchState) {
        lastSwitchState = currentState;
        mainWindow.webContents.send("switch-changed", currentState);
      }
    } catch (err) {}
  }, 50);
}

function setupKeyboardFallback(mainWindow: BrowserWindow) {
  let virtualButtonState = 0;

  mainWindow.webContents.on("before-input-event", (event, input) => {
    let bit = 0;
    switch (input.key) {
      case "ArrowRight": bit = 0b0001; break;
      case "ArrowDown":  bit = 0b0010; break;
      case "ArrowUp":    bit = 0b0100; break;
      case "ArrowLeft":  bit = 0b1000; break;
      case "Enter":      bit = 0b1100; break;
      case "Escape":     bit = 0b0011; break;
      case "Backspace":  bit = 0b1111; break;
      default: return;
    }

    const prevState = virtualButtonState;

    if (input.type === "keyDown") {
      virtualButtonState |= bit;
    } else if (input.type === "keyUp") {
      virtualButtonState &= ~bit;
    }

    if (virtualButtonState !== prevState) {
      mainWindow.webContents.send("push-button-changed", virtualButtonState);
    }
  });
}

export { setupKeyboardFallback, createWindow, registerIpcHandlers, startFpgaPolling }