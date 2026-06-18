import path from "path";
import { app } from "electron";

function getPreloadPath() {
    return path.join(
        app.getAppPath(),
        (process.env.NODE_ENV == "development") ? "." : "..",
        "/dist-electron/preload.cjs"
    );
}

function getPythonPath() {
    return path.join(
        app.getAppPath(),
        (process.env.NODE_ENV == "development") ? "." : "..",
        "/dist-python/"
    );
}

export { getPreloadPath, getPythonPath }