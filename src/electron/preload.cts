const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    writeGreenLeds: async (_: any, data: number) => {
        electron.ipcRenderer.invoke("writeGreenLeds")
    },

    writeRedLeds: async (_: any, data: number) => {
        electron.ipcRenderer.invoke("writeRedLeds")
    }
});