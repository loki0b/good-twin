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
  let virtualSwitchState = 0;

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && !input.isAutoRepeat) {
      let switchBit = 0;
      switch (input.key.toLowerCase()) {
        case "q": switchBit = 0b00001; break; // Switch 0
        case "w": switchBit = 0b00010; break; // Switch 1
        case "e": switchBit = 0b00100; break; // Switch 2
        case "r": switchBit = 0b01000; break; // Switch 3
        case "t": switchBit = 0b10000; break; // Switch 4
      }

      if (switchBit !== 0) {
        virtualSwitchState ^= switchBit;
        mainWindow.webContents.send("switch-changed", virtualSwitchState);
        return;
      }
    }

    let buttonBit = 0;
    switch (input.key) {
      case "ArrowRight": buttonBit = 0b0001; break;
      case "ArrowDown":  buttonBit = 0b0010; break;
      case "ArrowUp":    buttonBit = 0b0100; break;
      case "ArrowLeft":  buttonBit = 0b1000; break;
      case "Enter":      buttonBit = 0b1100; break;
      case "Escape":     buttonBit = 0b0011; break;
      case "Backspace":  buttonBit = 0b1111; break;
    }

    if (buttonBit !== 0) {
      const prevState = virtualButtonState;

      if (input.type === "keyDown") {
        virtualButtonState |= buttonBit;
      } else if (input.type === "keyUp") {
        virtualButtonState &= ~buttonBit;
      }

      if (virtualButtonState !== prevState) {
        mainWindow.webContents.send("push-button-changed", virtualButtonState);
      }
    }
  });
}

export { setupKeyboardFallback, createWindow, registerIpcHandlers, startFpgaPolling }