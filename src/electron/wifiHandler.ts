import { spawn } from "child_process";
import { getPythonPath } from "./utils.js";

function python(): Promise<string> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn(getPythonPath());
        let output = "";

        pythonProcess.stdout.on("data", (chunk) => {
            output += chunk.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Processo encerrado com código ${code}`));
            }
        });

        pythonProcess.on("error", (err) => {
            reject(err);
        });
    });
}

export { python }