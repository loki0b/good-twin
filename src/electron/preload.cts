const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    writeGreenLedBus: (data: number) => {
        electron.ipcRenderer.invoke("write-green-led-bus", data);
    },

    writeRedLedBus: (data: number) => {
        electron.ipcRenderer.invoke("write-red-led-bus", data);
    },

    onPushButtonChange: (callback: (state: number) => void) => {
        electron.ipcRenderer.on("push-button-changed", (_: any, state: number) => callback(state));
    },

    onSwitchChange: (callback: (state: number) =>void) => {
        electron.ipcRenderer.on("switch-changed", (_: any, state: number) => callback(state));
    }
});