import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./utils.js";
import { initFPGA, closeFPGA, writeGreenLeds, writeRedLeds } from "./fpgaHandler.js"

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath()
    }
  });

  if (process.env.NODE_ENV == "development") mainWindow.loadURL("http://localhost:5123");
  else mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));

  ipcMain.handle("writeGreenLeds", (_, data) => {
    writeGreenLeds(data);
  });

  ipcMain.handle("writeRedLeds", (_, data) => {
    writeRedLeds(data);
  });

  try {
    initFPGA();
  } catch (err) {
    console.log(err);
  }
});

app.on("will-quit", () =>{
  try {
    closeFPGA();
  } catch (err) {
    console.log(err);
  }
});