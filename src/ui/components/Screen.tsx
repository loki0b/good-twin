import { useState, useEffect, useRef } from "react";
import raven from "../assets/raven1.png";
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
    password?: string
}

const MOCK_DATA = [
    { bssid: 'oi', essid: 'Lorem Ipsum 1', channel: 'oiii', frequency: 'my hearts' },
    { bssid: 'oi', essid: 'Lorem Ipsum 2', channel: 'oiii', frequency: 'my hearts' },
    { bssid: 'oi', essid: 'Lorem Ipsum 3', channel: 'oiii', frequency: 'my hearts' },
    { bssid: 'oi', essid: 'Lorem Ipsum 4', channel: 'oiii', frequency: 'my hearts' },
    { bssid: 'oi', essid: 'Lorem Ipsum 5', channel: 'oiii', frequency: 'my hearts' },
    { bssid: 'oi', essid: 'Lorem Ipsum 6', channel: 'oiii', frequency: 'my hearts' },
];

const Screen = ({ bttns }: { bttns: Bttn[] }) => {
    const [curPage, setCurrPage] = useState<PageView>('start');
    const [start, setStart] = useState(false);
    const [scanList, setScanList] = useState<ScanList[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanElement, setScanElement] = useState<null | ScanList>(null)
    const [save, setSave] = useState(false)
    const [fieldData, setFieldData] = useState({
        essid: '',
        channel: [''],
        frequency: '',
        password: ''
    })

    const [isListItemSelected, setIsListItemSelected] = useState<null | number>(0);

    const [isFieldSelected, setIsFieldSelected] = useState<null | number>(0)
    const [isChannelSelected, setIsChannelSelected] = useState<null | number>(0)
    const [isFreqSelected, setIsFreqSelected] = useState<null | number>(0)

    const boxRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);

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
                setIsListItemSelected(scan.length > 0 ? 0 : null); 
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

    useEffect(() => {
        if (curPage !== 'netList' || scanList.length === 0) return;

        const activeButton = bttns.find(b => b.isOn);
        if (!activeButton) return;

        setIsListItemSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'top') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'bottom') {
                nextIndex = Math.min(scanList.length - 1, current + 1);
            } else if (activeButton.buttonTitle === 'middle') {
                setScanElement(scanList[current])
                goToPage('netConfig')
            }

            setTimeout(() => {
                const container = boxRef.current;
                const element = container?.children[nextIndex] as HTMLElement;
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }
            }, 0);

            return nextIndex;
        });

    }, [bttns, curPage, scanList]); 

    useEffect(() => {
        if (curPage !== 'netConfig') return;

        if (isFieldSelected != 2) {
            setIsFreqSelected(null)
        } else {
            setIsFreqSelected(0)
        }

        if (isFieldSelected != 4) {
            setIsFreqSelected(null)
        } else {
            setIsFreqSelected(0)
        }

        const activeButton = bttns.find(b => b.isOn);
        if (!activeButton) return;

        const MAX_FIELDS = 7; 

        setIsFieldSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'top') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'bottom') {
                nextIndex = Math.min(MAX_FIELDS, current + 1);
            } else if (activeButton.buttonTitle === 'middle') {
                if (current === 7) {
                    goToPage('netDetail');
                }
                return current;
            } else if (activeButton.buttonTitle === 'left') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'right') {
                nextIndex = Math.min(MAX_FIELDS, current + 1);
            }

            if (nextIndex !== current) {
                setTimeout(() => {
                    const container = fieldRef.current;
                    const element = container?.children[nextIndex] as HTMLElement;
                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                        });
                    }
                }, 0);
            }

            return nextIndex;
        });

    }, [bttns, curPage]); 

    

    return (
        <div className='w-141.75 h-71.75 bg-orange-500 border-8 overflow-hidden border-black'>
            {
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
                curPage === 'scanning' && (
                    <div className="w-full h-full pulse flex items-center justify-center font-pixelify-sans text-2xl">
                        Loading...
                    </div>
                )
            }
            {
                curPage === 'netList' && (
                    <div className="p-4 font-pixelify-sans h-full flex flex-col">
                        <p className="bg-black font-black text-xl py-2 pl-6 text-orange-500 w-full">
                            AVAILABLE NETWORKS
                        </p>
                        <div className="h-40 mt-4 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden" ref={boxRef}>
                            {
                                scanList.map((listElement, index) => (
                                    <div 
                                        key={index} 
                                        className={`${isListItemSelected === index ? 'bg-white text-orange-500' : 'text-white'} font-bold h-8 w-full px-6 flex items-center`}
                                    >
                                        {listElement.essid}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )
            }
            {
                curPage === 'netConfig' && (
                    <div className="p-4 font-pixelify-sans font-bold h-full overflow-hidden">
                        <div ref={fieldRef} className="text-md flex flex-col gap-0.5 text-orange-700 h-full overflow-y-auto [scrollbar-none] [&::-webkit-scrollbar]:hidden">
                            
                            ESSID
                            <input 
                                type="text" 
                                value={scanElement?.essid}
                                onChange={(e) => setFieldData({ ...fieldData, essid: e.target.value })} 
                                className={`${isFieldSelected === 0 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`} 
                                placeholder={scanElement?.essid}
                                ref={(el) => { if (isFieldSelected === 0) el?.focus(); }} 
                            />

                            PASSWORD
                            <input 
                                type="text" 
                                value={scanElement?.password}
                                onChange={(e) => setFieldData({ ...fieldData, password: e.target.value })} 
                                className={`${isFieldSelected === 1 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`} 
                                placeholder={scanElement?.password}
                                ref={(el) => { if (isFieldSelected === 1) el?.focus(); }}
                            />

                            FREQUENCY
                            <div className="flex gap-4">
                                <div className={`${isFieldSelected === 2 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                    2.4GHz
                                </div>
                                <div className={`${isFieldSelected === 3 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                    5GHz
                                </div>
                            </div>

                            CHANNEL
                            <div className="flex w-full justify-between">
                                <div className="flex gap-4">
                                    <div className={`${isFieldSelected === 4  ? 'bg-black text-white' : 'bg-white text-orange-500'} ${isChannelSelected === 0 && 'bg-black text-white'} flex justify-center items-center w-24 h-8`}>
                                        CH 1
                                    </div>
                                    <div className={`${isFieldSelected === 5 ? 'bg-black text-white' : 'bg-white text-orange-500'}  flex justify-center items-center w-24 h-8`}>
                                        CH 6
                                    </div>
                                    <div className={`${isFieldSelected === 6 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                        CH 11
                                    </div>
                                </div>
                                <div className={`${isFieldSelected === 7 ? 'bg-black text-white' : 'bg-orange-500 text-black'} text-xl flex justify-center items-center w-24 h-8`}>
                                    SAVE
                                </div>
                            </div>

                        </div>
                    </div>
                )
                }
        </div>
    );
}

export default Screen;