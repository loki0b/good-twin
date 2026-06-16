async function writeGreenLeds(data: number) {
    await (window as any).electron.writeGreenLedsBus(data);
}

async function writeRedLeds(data: number) {
    await (window as any).electron.writeRedLedBus(data);
}

async function readSwitchs() {
    return await (window as any).electron.readSwitchBus();
}

async function readPushButtons() {
    return await (window as any).electron.readPushButtonBus()
}

export { writeGreenLeds, writeRedLeds, readPushButtons, readSwitchs }