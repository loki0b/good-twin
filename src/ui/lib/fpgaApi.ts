async function writeGreenLeds(data: number): Promise<void> {
    await window.electron.writeGreenLedBus(data);
}

async function writeRedLeds(data: number): Promise<void>{
    await window.electron.writeRedLedBus(data);
}

export { writeGreenLeds, writeRedLeds }