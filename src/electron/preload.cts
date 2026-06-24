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
    },

    startAp: (ssid: string, channel: number, band: string, password?: string) => { 
        return electron.ipcRenderer.invoke("start-ap", ssid, channel, band, password);
    },
    
    stopAp: () => electron.ipcRenderer.invoke("stop-ap"),
    startDhcp: (captive: boolean) => electron.ipcRenderer.invoke("start-dhcp", captive),
    stopDhcp: () => electron.ipcRenderer.invoke("stop-dhcp"),
    scanNetworks: () => electron.ipcRenderer.invoke("scan-networks"),
    getClients: () => electron.ipcRenderer.invoke("get-clients")
});