import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./utils.js";
import { initFPGA, closeFPGA, writeGreenLeds, writeRedLeds, readPushButtons, readSwitches } from "./fpgaHandler.js"

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath()
    }
  });

  if (process.env.NODE_ENV == "development") mainWindow.loadURL("http://localhost:5123");
  else mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));

  try {
    initFPGA();
  } catch (err) {
    console.log(err);
  }
});

app.on("ready", () => {
  ipcMain.handle("write-green-led-bus", async (event, data) => {
    writeGreenLeds(data);
  });

  ipcMain.handle("write-red-led-bus", async (event, data) => {
    writeRedLeds(data);
  });

  ipcMain.handle("read-switch-bus", async (event) => {
    return readSwitches();
  });

  ipcMain.handle("read-push-button-bus", async (event) => {
    return readPushButtons();
  });
});

app.on("will-quit", () =>{
  try {
    closeFPGA();
  } catch (err) {
    console.log(err);
  }
});