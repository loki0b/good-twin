import { app } from "electron";
import { initFPGA, closeFPGA } from "./fpgaHandler.js";
import { stopAllWifiServices } from "./wifiHandler.js";
import { createWindow, registerIpcHandlers, startFpgaPolling, setupKeyboardFallback } from "./setup.js";

app.whenReady().then(async () => {
  const isDev = process.env.NODE_ENV === "development";
  const mainWindow = createWindow(app.getAppPath(), isDev);
  
  registerIpcHandlers();

  const fpgaAvailable = await initFPGA();
  
  if (fpgaAvailable) {
    startFpgaPolling(mainWindow);
  } else {
    setupKeyboardFallback(mainWindow);
  }
});

app.on("will-quit", () => {
  stopAllWifiServices();
  closeFPGA();
});