import { useState } from "react";
import { greenLedsBus } from "../lib/fpgaApi.js"

function Home() {
    const writeGreen = async () => {
        await greenLedsBus(0x0000000F);
    }

    return (
        <button onClick={writeGreen}>Clique!</button>
    )
}

export default Home;