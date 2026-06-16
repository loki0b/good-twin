const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    writeGreenLedBus: (data: number) => {
        electron.ipcRenderer.invoke("write-green-led-bus", data);
    },

    writeRedLedBus: (data: number) => {
        electron.ipcRenderer.invoke("write-red-led-bus", data);
    },

    readSwitchBus: () => {
        return electron.ipcRenderer.invoke("read-switch-bus");
    },

    readPushButtonBus: () => {
        return electron.ipcRenderer.invoke("read-push-button-bus");
    }
});