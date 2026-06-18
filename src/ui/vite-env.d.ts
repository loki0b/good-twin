/// <reference types="vite/client" />

interface Window {
    electron: {
        writeGreenLedBus: (data: number) => Promise<void>;
        writeRedLedBus: (data: number) => Promise<void>;
        startAp: (ssid: string, channel: number, band: string, password?: string) => Promise<boolean>;
        stopAp: () => Promise<boolean>;
        startDhcp: (captive: boolean) => Promise<boolean>;
        stopDhcp: () => Promise<boolean>;
        scanNetworks: () => Promise<any>;
        getClients: () => Promise<any>;
        onPushButtonChanged?: (callback: (state: number) => void) => void;
        onSwitchChanged?: (callback: (state: number) => void) => void;
    };
}