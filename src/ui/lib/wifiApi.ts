async function startAp(ssid: string, channel: number, band: string, password?: string): Promise<boolean> {
    return await window.electron.startAp(ssid, channel, band, password);
}

async function stopAp(): Promise<boolean> {
    return await window.electron.stopAp();
}

async function startDhcp(captive: boolean | false): Promise<boolean> {
    return await window.electron.startDhcp(captive);
}

async function stopDhcp(): Promise<boolean> {
    return await window.electron.stopDhcp();
}

async function scanNetworks(): Promise<any> {
    return await window.electron.scanNetworks();
}

async function getClients(): Promise<any> {
    return await window.electron.getClients();
}

export { startAp, stopAp, startDhcp, stopDhcp, scanNetworks, getClients }