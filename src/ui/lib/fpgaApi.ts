import { writeGreenLeds, writeRedLeds } from "../../electron/fpgaHandler.js"

async function greenLedsBus(data: number) {
    writeGreenLeds(data);
}

async function redLedsBus(data: number) {
    writeRedLeds(data);
}

export { greenLedsBus, redLedsBus }