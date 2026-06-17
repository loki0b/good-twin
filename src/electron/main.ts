import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./utils.js";
import { initFPGA, closeFPGA, writeGreenLeds, writeRedLeds, readPushButtons, readSwitches } from "./fpgaHandler.js"
import { python } from "./wifiHandler.js";

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath()
    }
  });

  if (process.env.NODE_ENV == "development") mainWindow.loadURL("http://localhost:5123");
  else mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));

  initFPGA();

  // Polling buttons state
  let lastButtonState = -1;
  setInterval(async () => {
    try {
      const currentState = await readPushButtons();

      if ((currentState !== null) && (currentState != lastButtonState)) {
        lastButtonState = currentState;

        mainWindow.webContents.send("push-button-changed", currentState);
      }
    } catch (err) {}
  }, 50);


  // Polling switchs states
  let lastSwitchState = -1;
  setInterval(async () => {
    try {
      const currentState = await readSwitches();

      if ((currentState !== null) && (currentState != lastButtonState)) {
        lastSwitchState = currentState;

        mainWindow.webContents.send("switch-changed", currentState);
      }
    } catch (err) {}
  });
});

app.on("ready", () => {
  ipcMain.handle("write-green-led-bus", (event, data) => {
    writeGreenLeds(data);
  });

  ipcMain.handle("write-red-led-bus", (event, data) => {
    writeRedLeds(data);
  });

  ipcMain.handle("read-switch-bus", (event) => {
    return readSwitches();
  });

  ipcMain.handle("read-push-button-bus", (event) => {
    return readPushButtons();
  });

  ipcMain.handle("python", (event) => {
    return python();
  })
});

app.on("will-quit", () =>{
  closeFPGA();
});