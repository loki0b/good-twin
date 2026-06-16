import { greenLedsBus } from "../lib/fpgaApi.js"

let data = 0x00000000

function Home() {
    const writeGreen = async () => {
        if (data === 0x00000000) data = 0x0000000F;
        else data = 0x00000000;

        await greenLedsBus(data);
    }

    return (
        <button onClick={writeGreen}>Clique!</button>
    )
}

export default Home;