import { spawn, ChildProcess, execFile, exec } from "node:child_process";
import path from "node:path";
import { getPythonPath } from "./utils.js";

let hostapdProcess: ChildProcess | null = null;
let dnsmasqProcess: ChildProcess | null = null;

function waitForInterfaceReady(iface: string, expectedIp: string, timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
            exec(`ip addr show ${iface}`, (err, stdout) => {
                if (!err && stdout.includes(expectedIp)) {
                    clearInterval(interval);
                    resolve(true); 
                } else if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    resolve(false); 
                }
            });
        }, 500);
    });
}

async function startAp(ssid: string, channel: number, band: string, password?: string): Promise<boolean> {
    if (hostapdProcess) return false;

    const execPath = path.join(getPythonPath(), "hostapd");
    const args = ["--ssid", ssid, "--channel", channel.toString(), "--band", band];
    if (password) args.push("--password", password);

    let processCrashed = false;

    hostapdProcess = spawn(execPath, args);

    hostapdProcess.on("exit", () => {
        hostapdProcess = null;
        processCrashed = true;
    });

    // Wait for the interface to exist AND have the IP
    const isReady = await waitForInterfaceReady("ap0", "10.0.0.1");

    if (processCrashed || !isReady) {
        return false;
    }

    return true;
}

function stopAp(): boolean {
    if (hostapdProcess) {
        hostapdProcess.kill("SIGTERM");
        hostapdProcess = null;
    }
    return true;
}

function startDhcp(captive: boolean): boolean {
    if (dnsmasqProcess) return false;

    const execPath = path.join(getPythonPath(), "dnsmasq");
    const args = captive ? ["--captive"] : [];

    dnsmasqProcess = spawn(execPath, args);

    dnsmasqProcess.on("exit", () => {
        dnsmasqProcess = null;
    });

    return true;
}

function stopDhcp(): boolean {
    if (dnsmasqProcess) {
        dnsmasqProcess.kill("SIGTERM");
        dnsmasqProcess = null;
    }
    return true;
}

function scanNetworks(): Promise<any> {
    return new Promise((resolve, reject) => {
        const execPath = path.join(getPythonPath(), "scanner");
        execFile(execPath, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                reject(e);
            }
        });
    });
}

function getClients(): Promise<any> {
    return new Promise((resolve, reject) => {
        const execPath = path.join(getPythonPath(), "client_monitor");
        execFile(execPath, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                reject(e);
            }
        });
    });
}

function stopAllWifiServices(): void {
    stopAp();
    stopDhcp();
}

export { startAp, stopAp, startDhcp, stopDhcp, scanNetworks, getClients, stopAllWifiServices }