import fs from "node:fs/promises";

const FPGA_DEV         = "/dev/fpga";
const PUSH_BUTTON_ADDR = 0xC000;
const SWITCH_ADDR      = 0xC020;
const GREEN_LED_ADDR   = 0xC040;
const RED_LED_ADDR     = 0xC060;
// const HEX

const BUFFER_SIZE      = 4;

let FPGA_FD: fs.FileHandle | null = null;

async function initFPGA() {
    try {
        if (!FPGA_FD) {
            FPGA_FD = await fs.open(FPGA_DEV, "r+");
            console.log("FPGA ready");
        }
    } catch (err) {
        console.error(`Failed to open FPGA: ${err}`);
    }
}

async function closeFPGA() {
    if (FPGA_FD) {
        await FPGA_FD.close();
        FPGA_FD = null;
    }
}

async function writeGreenLeds(data: number) {
    await writeToBus(GREEN_LED_ADDR, data);
}

async function writeRedLeds(data: number) {
    await writeToBus(RED_LED_ADDR, data);
}

async function readSwitches() {
    return await readFromBus(SWITCH_ADDR);
}

async function readPushButtons() {
    return await readFromBus(PUSH_BUTTON_ADDR);
}

async function writeToBus(busAddress: number, data: number) {
    try {
        if (!FPGA_FD) throw new Error("FPGA not available");

        const buffer = Buffer.alloc(BUFFER_SIZE);
        buffer.writeUInt32LE(data, 0);

        await FPGA_FD.write(buffer, 0, buffer.length, busAddress);
        
        console.log(`Write: 0x${data.toString(16)} to 0x${busAddress.toString(16)}`);
    } catch (err) {
        console.error(`Error: 0x${busAddress.toString(16)}: ${err}`);
    }
}

async function readFromBus(busAddress: number) {
    try {
        if (!FPGA_FD) throw new Error("FPGA not available");

        const buffer = Buffer.alloc(BUFFER_SIZE);
        await FPGA_FD.read(buffer, 0, BUFFER_SIZE, busAddress);

        const data = buffer.readUInt32LE(0);
        console.log(`Read: 0x${data.toString(16)} to 0x${busAddress.toString(16)}`);

        return data;
    } catch (err) {
        console.error(`Error: 0x${busAddress.toString(16)}: ${err}`);
        return -1
    }
}

export { initFPGA, closeFPGA, writeGreenLeds, writeRedLeds, readPushButtons, readSwitches }