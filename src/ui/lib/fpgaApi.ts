function writeGreenLeds(data: number) {
    (window as any).electron.writeGreenLedsBus(data);
}

function writeRedLeds(data: number) {
    (window as any).electron.writeRedLedBus(data);
}

function readSwitchs() {
    return (window as any).electron.readSwitchBus();
}

function readPushButtons() {
    return (window as any).electron.readPushButtonBus();
}

export { writeGreenLeds, writeRedLeds, readPushButtons, readSwitchs }