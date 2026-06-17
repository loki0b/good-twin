function writeGreenLeds(data: number) {
    (window as any).electron.writeGreenLedsBus(data);
}

function writeRedLeds(data: number) {
    (window as any).electron.writeRedLedBus(data);
}

export { writeGreenLeds, writeRedLeds }