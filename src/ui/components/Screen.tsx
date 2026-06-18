import { useState, useEffect } from "react";
import raven from "../assets/raven1.png"
import { scanNetworks } from "../lib/wifiApi.js";

type PageView = 'start' | 'scanning' | 'netList' | 'netConfig' | 'netDetail';

type Bttn = {
    buttonTitle: string,
    isOn: boolean
}

type ScanList = {
    bssid: string,
    essid: string,
    channel: string,
    frequency: string,
}

const Screen = ({ bttns }: { bttns: Bttn[] }) => {
    const [curPage, setCurrPage] = useState<PageView>('start');
    const [start, setStart] = useState(false)
    const [scanList, setScanList] = useState<ScanList[]>([])
    const [loading, setLoading] = useState(false)

    const goToPage = (pageName: PageView) => setCurrPage(pageName);

    useEffect(() => {
        if (curPage === 'start' && bttns[4]?.isOn) {
            setStart(true);
            goToPage('scanning');
        }
    }, [curPage, bttns]); 

    useEffect(() => {
        if (curPage !== 'scanning') return; 

        const fetchNetworks = async () => {
            setLoading(true);
            try {
                const scan = await scanNetworks();
                setScanList(scan);
                goToPage('netList'); 
            } catch (error) {
                console.error("Failed to scan networks:", error);
                goToPage('start'); 
            } finally {
                setLoading(false);
            }
        };

        fetchNetworks();
    }, [curPage]); 

    return (
        <div className='w-141.75 h-71.75 bg-orange-500 border-8 overflow-hidden border-black'>
            {
                //start
                curPage === "start" && (
                    <div
                        className="w-full h-full flex flex-col gap-0 justify-center items-center bg-center bg-no-repeat object-cover"
                        style={{ backgroundImage: `url(${raven})` }}
                    >
                        <p className="font-bold text-8xl font-pixelify-sans">HELLO</p>
                        <p className="font-bold text-2xl font-pixelify-sans">press enter to start.</p>
                    </div>
                )
            }
            {
                //scanning
                curPage === 'scanning' && (
                    <div className="w-full h-full flex items-center justify-center font-pixelify-sans text-2xl">
                        Loading...
                    </div>
                )
            }
            {
                //netList
                curPage === 'netList' && (
                    <div className="p-4 font-pixelify-sans">
                        Oi
                    </div>
                )
            }
        </div>
    )
}

export default Screen;