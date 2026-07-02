import { useState, useEffect, useRef, useMemo } from "react";
import raven from "../assets/raven1.png";
import { scanNetworks, startAp, getClients, startDhcp, stopAp, stopDhcp } from "../lib/wifiApi.js";

type PageView = 'start' | 'scanning' | 'netList' | 'netConfig' | 'netDetail' | 'waiting';
type Frequency = '2.4' | '5';

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

type Client = {
    index: string,
    mac: string,
    ip: string
}

const Screen = ({ bttns, swtch }: { bttns: Bttn[], swtch: Bttn[] }) => {
    const [curPage, setCurrPage] = useState<PageView>('start');
    const [scanList, setScanList] = useState<ScanList[]>([]);
    const [scanElement, setScanElement] = useState<null | ScanList>(null);

    const [fieldData, setFieldData] = useState({
        ssid: '',
        channel: 1,
        band: '2.4' as Frequency,
        password: ''
    });

    const [clientList, setClientList] = useState<Client[]>([]);

    const [isListItemSelected, setIsListItemSelected] = useState<null | number>(null);
    const [isItemSelected, setIsItemSelected] = useState<null | number>(null);
    const [isFieldSelected, setIsFieldSelected] = useState<number>(0);

    const boxRef = useRef<HTMLDivElement>(null);
    const lastBtnRef = useRef<string | null>(null);
    const lastListRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);

    const goToPage = (pageName: PageView) => setCurrPage(pageName);

    const curListItems = useMemo(
        () => scanList.filter(item => item.essid.length > 0),
        [scanList]
    );

    useEffect(() => {
        const enterPressed = bttns.find(b => b.buttonTitle === 'ENTER')?.isOn;
        if (curPage === 'start' && enterPressed) {
            goToPage('scanning');
        }
    }, [curPage, bttns]);

    useEffect(() => {
        if (curPage !== 'scanning') return;

        const fetchNetworks = async () => {
            try {
                const scan = await scanNetworks();
                setScanList(scan);
                setIsListItemSelected(scan.length > 0 ? 0 : null);
                goToPage('netList');
            } catch (error) {
                console.error("Failed to scan networks:", error);
                goToPage('start');
            }
        };

        fetchNetworks();
    }, [curPage]);

    useEffect(() => {
        if (curPage !== 'netList' || curListItems.length === 0) return;

        const activeButton = bttns.find(b => b.isOn);
        if (!activeButton) return;

        if (activeButton.buttonTitle === 'ON_OFF') {
            goToPage('start');
            return;
        }

        setIsListItemSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'UP') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'DOWN') {
                nextIndex = Math.min(curListItems.length - 1, current + 1);
            } else if (activeButton.buttonTitle === 'ENTER') {
                const selectedNet = curListItems[current];
                setScanElement(selectedNet);
                setFieldData({
                    ssid: selectedNet?.essid || '',
                    password: selectedNet?.password || '',
                    channel: Number(selectedNet?.channel) || 1,
                    band: String(selectedNet?.frequency).includes('5') ? '5' : '2.4' as Frequency
                });
                setIsFieldSelected(0);
                goToPage('netConfig');
            }

            setTimeout(() => {
                const container = boxRef.current;
                const element = container?.children[nextIndex] as HTMLElement;
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);

            return nextIndex;
        });
    }, [bttns, curPage, curListItems]);
    

    useEffect(() => {
        if (curPage !== 'netConfig') return;

        const activeButton = bttns.find(b => b.isOn);
        
        // 1. Reset the edge-detector if no buttons are pressed
        if (!activeButton) {
            lastBtnRef.current = null;
            return;
        }

        // 2. Ignore the press if the button is still being held down from the previous screen
        if (lastBtnRef.current === activeButton.buttonTitle) return;
        lastBtnRef.current = activeButton.buttonTitle;

        const MAX_FIELD_INDEX = 3;

        if (activeButton.buttonTitle === 'ON_OFF') {
            goToPage('start');
            return;
        } else if (activeButton.buttonTitle === 'RETURN') {
            goToPage('netList');
            return;
        }

        setIsFieldSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'UP') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'DOWN') {
                nextIndex = Math.min(MAX_FIELD_INDEX, current + 1);
            } else if (activeButton.buttonTitle === 'ENTER') {
                
                // 3. Only create the AP if the user is highlighting the SAVE button
                if (current === MAX_FIELD_INDEX) {
                    const pwd = fieldData.password.trim();
                    
                    if (pwd.length > 0 && pwd.length < 8) {
                        console.error("WPA2 requires a password of at least 8 characters.");
                        return current;
                    }

                    const finalPwd = pwd === '' ? undefined : pwd;
                    
                    (async () => {
                        const apStarted = await startAp(fieldData.ssid, fieldData.channel, fieldData.band, finalPwd);
                        
                        if (!apStarted) {
                            console.error("Failed to start AP (hostapd crashed or timed out)");
                            return;
                        }

                        const dhcpStarted = await startDhcp(false);
                        
                        if (dhcpStarted) {
                            goToPage('waiting');
                        } else {
                            console.error("Failed to start DHCP");
                        }
                    })();
                } else {
                    // If they are on a text input and press ENTER, move the cursor down
                    nextIndex = Math.min(MAX_FIELD_INDEX, current + 1);
                }
            }

            if (nextIndex !== current) {
                setTimeout(() => {
                    const container = fieldRef.current;
                    const element = container?.children[nextIndex] as HTMLElement;
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 0);
            }

            return nextIndex;
        });

    }, [bttns, curPage, fieldData]);

    useEffect(() => {
        if (curPage !== 'netConfig') return;

        setFieldData(prev => {
            const sw0On = swtch.find(s => s.buttonTitle === 'SW0')?.isOn;
            const sw1On = swtch.find(s => s.buttonTitle === 'SW1')?.isOn;
            const sw2On = swtch.find(s => s.buttonTitle === 'SW2')?.isOn;
            const sw3On = swtch.find(s => s.buttonTitle === 'SW3')?.isOn;

            const newBand: Frequency = sw0On ? '5' : '2.4';
            
            let newChannel = prev.channel;

            if (sw3On) newChannel = 11;
            else if (sw2On) newChannel = 6;
            else if (sw1On) newChannel = 1;

            if (prev.band !== newBand || prev.channel !== newChannel) {
                return { ...prev, band: newBand, channel: newChannel };
            }
            return prev;
        });
    }, [swtch, curPage]);

    useEffect(() => {
        if (curPage !== 'netDetail') return;

        const fetchClients = async () => {
            try {
                const scan = await getClients();
                setClientList(scan);
            } catch (error) {
                console.error("Failed to fetch connected clients:", error);
            }
        };

        fetchClients();
        const intervalId = setInterval(fetchClients, 5000);
        return () => clearInterval(intervalId);
    }, [curPage]);

    useEffect(() => {
        if (curPage !== 'netDetail') return;

        const activeButton = bttns.find(b => b.isOn);
        if (!activeButton) return;

        if (activeButton.buttonTitle === 'ON_OFF') {
            stopAp();
            stopDhcp();
            goToPage('start');
            return;
        } else if (activeButton.buttonTitle === 'RETURN') {
            stopAp();
            stopDhcp();
            goToPage('netConfig');
            return;
        }

        setIsItemSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'UP') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'DOWN') {
                nextIndex = Math.min(clientList.length - 1, current + 1);
            }

            setTimeout(() => {
                const container = lastListRef.current;
                const element = container?.children[nextIndex] as HTMLElement;
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);

            return nextIndex;
        });
    }, [bttns, curPage, clientList.length]);

    useEffect(() => {
        if (curPage !== 'waiting') return;

        const timer = setTimeout(() => {
            goToPage('netDetail');
        }, 3000);

        return () => clearTimeout(timer);

    }, [curPage]);

    return (
        <div className='w-141.75 h-71.75 bg-orange-500 border-8 overflow-hidden border-black'>
            {curPage === "start" && (
                <div
                    className="w-full h-full flex flex-col justify-center items-center bg-center bg-no-repeat object-cover"
                    style={{ backgroundImage: `url(${raven})` }}
                >
                    <p className="font-bold text-8xl font-pixelify-sans">HELLO</p>
                    <p className="font-bold text-2xl font-pixelify-sans">press enter to start.</p>
                </div>
            )}
            {curPage === 'scanning' && (
                <div className="w-full h-full pulse flex items-center justify-center font-pixelify-sans text-2xl">
                    Scanning...
                </div>
            )}
            {curPage === 'waiting' && (
                <div className="w-full h-full pulse flex items-center justify-center font-pixelify-sans text-2xl">
                    Creating your new AP...
                </div>
            )}
            {curPage === 'netList' && (
                <div className="p-4 font-pixelify-sans h-full flex flex-col">
                    <p className="bg-black font-black text-md py-2 pl-6 text-orange-500 w-full">
                        AVAILABLE NETWORKS
                    </p>
                    <div className="h-40 mt-4 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden" ref={boxRef}>
                        {curListItems.map((listElement, index) => (
                            <div
                                key={index}
                                className={`${isListItemSelected === index ? 'bg-white text-orange-500' : 'text-white'} font-bold h-8 w-full px-6 flex items-center`}
                            >
                                {listElement.essid}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {curPage === 'netConfig' && (
                <div className="p-4 font-pixelify-sans font-bold h-full overflow-hidden">
                    <div ref={fieldRef} className="text-md flex flex-col gap-0.5 text-orange-700 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">

                        ESSID
                        <input
                            type="text"
                            disabled={isFieldSelected !== 0}
                            value={fieldData.ssid}
                            onChange={(e) => setFieldData({ ...fieldData, ssid: e.target.value })}
                            className={`${isFieldSelected === 0 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`}
                            ref={(el) => { if (isFieldSelected === 0) el?.focus(); }}
                        />

                        PASSWORD
                        <input
                            type="text"
                            disabled={isFieldSelected !== 1}
                            value={fieldData.password}
                            onChange={(e) => setFieldData({ ...fieldData, password: e.target.value })}
                            className={`${isFieldSelected === 1 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`}
                            ref={(el) => { if (isFieldSelected === 1) el?.focus(); }}
                        />

                        FREQUENCY
                        <div className="flex gap-4 p-1">
                            <div className={`${fieldData.band === '2.4' ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                2.4GHz
                            </div>
                            <div className={`${fieldData.band === '5' ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                5GHz
                            </div>
                        </div>

                        CHANNEL
                        <div className="flex w-full justify-between">
                            <div className="flex gap-4">
                                <div className={`${fieldData.channel === 1 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                    CH 1
                                </div>
                                <div className={`${fieldData.channel === 6 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                    CH 6
                                </div>
                                <div className={`${fieldData.channel === 11 ? 'bg-black text-white' : 'bg-white text-orange-500'} flex justify-center items-center w-24 h-8`}>
                                    CH 11
                                </div>
                            </div>
                            <div
                                className={`${isFieldSelected === 3 ? 'text-white' : 'text-black'} text-xl flex justify-center items-center w-24 h-8`}
                            >
                                SAVE
                            </div>
                        </div>

                    </div>
                </div>
            )}
            {curPage === 'netDetail' && (
                <div className="p-4 font-pixelify-sans h-full flex flex-col font-bold overflow-y-auto w-full [&::-webkit-scrollbar]:hidden">
                    <p className="bg-black font-black text-xl py-2 pl-6 text-orange-500 w-full">
                        CONNECTED STATIONS [{fieldData.ssid}]
                    </p>
                    <div className="h-40 mt-4" ref={lastListRef}>
                        {clientList.map((listElement, index) => (
                            <div
                                key={index}
                                className={`${isItemSelected === index ? 'text-black' : 'text-white'} font-bold h-8 w-full px-6 flex justify-between items-center`}
                            >
                                <span>{listElement.index}</span>
                                <span>{listElement.ip}</span>
                                <span>{listElement.mac}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Screen;