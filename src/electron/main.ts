import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./utils.js";
import { initFPGA, closeFPGA, writeGreenLeds, writeRedLeds, readPushButtons, readSwitches } from "./fpgaHandler.js"

let fpgaAvailable = false;
let mainWindow: BrowserWindow;

app.on("ready", async () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
    preload: getPreloadPath()
    }
  });

  if (process.env.NODE_ENV == "development") mainWindow.loadURL("http://localhost:5123");
  else mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));

  fpgaAvailable = await initFPGA();
});

app.on("ready", () => {
  ipcMain.handle("write-green-led-bus", (event, data) => {
    writeGreenLeds(data);
  });

  ipcMain.handle("write-red-led-bus", (event, data) => {
    writeRedLeds(data);
  });
});

app.on("will-quit", () =>{
  closeFPGA();
});

app.on("ready", () => {
  if (fpgaAvailable) {
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

        if ((currentState !== null) && (currentState != lastSwitchState)) {
          lastSwitchState = currentState;

          mainWindow.webContents.send("switch-changed", currentState);
        }
      } catch (err) {}
    });
  } else {
    let virtualButtonState = 0;
    let bit = 0;

    mainWindow.webContents.on("before-input-event", (event, input) => {
      switch (input.key) {
        case "ArrowRight": bit = 0b0001; break; // RIGHT_BTN
        case "ArrowDown":  bit = 0b0010; break; // DOWN_BTN
        case "ArrowUp":    bit = 0b0100; break; // UP_BTN
        case "ArrowLeft":  bit = 0b1000; break; // LEFT_BTN
        case "Enter":      bit = 0b1100; break; // ENTER_BNT
        case "Escape":     bit = 0b0011; break; // RETURN_BTN
        case "Backspace":  bit = 0b1111; break; // ON_OFF_BTN 
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
})