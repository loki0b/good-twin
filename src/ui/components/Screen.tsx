import { useState, useEffect, useRef } from "react";
import raven from "../assets/raven1.png";
import { scanNetworks, startAp, getClients } from "../lib/wifiApi.js";

type PageView = 'start' | 'scanning' | 'netList' | 'netConfig' | 'netDetail';
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

const Screen = ({ bttns }: { bttns: Bttn[] }) => {
    const [curPage, setCurrPage] = useState<PageView>('start');
    const [scanList, setScanList] = useState<ScanList[]>([]);
    const [scanElement, setScanElement] = useState<null | ScanList>(null);

    const [fieldData, setFieldData] = useState({
        ssid: '',
        channel: 1,
        band: '2.4GHz' as Frequency,
        password: ''
    });

    const [clientList, setClientList] = useState<Client[]>([]);

    const [isListItemSelected, setIsListItemSelected] = useState<null | number>(0);
    const [isItemSelected, setIsItemSelected] = useState<null | number>(0);
    const [isFieldSelected, setIsFieldSelected] = useState<number>(0);
    
    const boxRef = useRef<HTMLDivElement>(null);
    const lastRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);

    const goToPage = (pageName: PageView) => setCurrPage(pageName);

    const curListItems = scanList.filter(item => item.essid.length > 0);

    useEffect(() => {
        if (curPage === 'start' && bttns[4]?.isOn) {
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

        if (activeButton.buttonTitle === 'onOff') {
            goToPage('start');
            return;
        }

        setIsListItemSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'top') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'bottom') {
                nextIndex = Math.min(curListItems.length - 1, current + 1);
            } else if (activeButton.buttonTitle === 'middle') {
                const selectedNet = curListItems[current];
                setScanElement(selectedNet);
                setFieldData({
                    ssid: selectedNet?.essid || '',
                    password: selectedNet?.password || '',
                    channel: Number(selectedNet?.channel) || 1,
                    band: (String(selectedNet?.frequency).includes('5') ? '5GHz' : '2.4GHz') as Frequency
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
    }, [bttns, curPage]);

    useEffect(() => {
        if (curPage !== 'netConfig') return;

        const activeButton = bttns.find(b => b.isOn);
        if (!activeButton) return;

        const MAX_FIELDS = 2; 

        if (activeButton.buttonTitle === 'onOff' ) {
            goToPage('start');
            return;
        } else if (activeButton.buttonTitle === 'return') {
            goToPage('netList');
            return;
        }

        if (activeButton.buttonTitle === 'Q_2.4') {
            setFieldData(prev => ({ ...prev, band: '2.4' }));
        } else if (activeButton.buttonTitle === 'W_5') {
            setFieldData(prev => ({ ...prev, band: '5' }));
        }

        if (activeButton.buttonTitle === 'E_CH1' && isFieldSelected != 0 && isFieldSelected != 1) {
            setFieldData(prev => ({ ...prev, channel: 1 }));
        } else if (activeButton.buttonTitle === 'R_CH2' && isFieldSelected != 0 && isFieldSelected != 1) {
            setFieldData(prev => ({ ...prev, channel: 6 }));
        } else if (activeButton.buttonTitle === 'T_CH3' && isFieldSelected != 0 && isFieldSelected != 1) {
            setFieldData(prev => ({ ...prev, channel: 11 }));
        }

        setIsFieldSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'top') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'bottom') {
                nextIndex = Math.min(MAX_FIELDS, current + 1);
            } else if (activeButton.buttonTitle === 'middle' && current === 2){
                console.log(fieldData)
                startAp(fieldData.ssid, fieldData.channel, fieldData.band, fieldData.password);
    
                console.log(startAp(fieldData.ssid, fieldData.channel, fieldData.band, fieldData.password))
                goToPage('netDetail');
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

        if (activeButton.buttonTitle === 'onOff') {
            goToPage('start');
            return;
        } else if (activeButton.buttonTitle === 'return') {
            goToPage('netConfig');
            return;
        }

        setIsItemSelected((prevSelected) => {
            const current = prevSelected ?? 0;
            let nextIndex = current;

            if (activeButton.buttonTitle === 'top') {
                nextIndex = Math.max(0, current - 1);
            } else if (activeButton.buttonTitle === 'bottom') {
                nextIndex = Math.min(clientList.length - 1, current + 1);
            }

            setTimeout(() => {
                const container = lastRef.current;
                const element = container?.children[nextIndex] as HTMLElement;
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);

            return nextIndex;
        });
    }, [bttns, curPage, clientList.length]);

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
            {curPage === 'netList' && (
                <div className="p-4 font-pixelify-sans h-full flex flex-col">
                    <p className="bg-black font-black text-xl py-2 pl-6 text-orange-500 w-full">
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
                        {
                            isFieldSelected === 0 ? (
                                <input 
                                type="text" 
                                value={fieldData.ssid}
                                onChange={(e) => setFieldData({ ...fieldData, ssid: e.target.value })} 
                                className={`${isFieldSelected === 0 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`} 
                                ref={(el) => { if (isFieldSelected === 0) el?.focus(); }} 
                            />
                            ): (
                                <input 
                                disabled
                                type="text" 
                                value={fieldData.ssid}
                                onChange={(e) => setFieldData({ ...fieldData, ssid: e.target.value })} 
                                className={`${isFieldSelected === 0 ? 'bg-black text-white' : 'bg-white text-orange-500'} w-full h-8 px-2 outline-none`} 
                                ref={(el) => { if (isFieldSelected === 0) el?.focus(); }} 
                            />
                            )
                        }

                        PASSWORD
                        {
                            isFieldSelected === 1 ? (
                                <input 
                                    type="text" 
                                    value={fieldData.password}
                                    onChange={(e) => setFieldData({ ...fieldData, password: e.target.value })} 
                                    className={`${isFieldSelected === 1 ? 'bg-black text-white' : 'bg-white text-orange-500 disabled:'} w-full h-8 px-2 outline-none`} 
                                    ref={(el) => { if (isFieldSelected === 1) el?.focus(); }}
                                />
                            ): (
                                <input 
                                disabled
                                type="text" 
                                value={fieldData.password}
                                onChange={(e) => setFieldData({ ...fieldData, password: e.target.value })} 
                                className={`${isFieldSelected === 1 ? 'bg-black text-white' : 'bg-white text-orange-500 disabled:'} w-full h-8 px-2 outline-none`} 
                                ref={(el) => { if (isFieldSelected === 1) el?.focus(); }}
                            />
                            )
                        }
                        

                        FREQUENCY
                        <div className={`flex gap-4 p-1}`}>
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
                                className={`${isFieldSelected === 2 ? 'text-white' : 'text-black'} text-xl flex justify-center items-center w-24 h-8`}
                            >
                                SAVE
                            </div>
                        </div>

                    </div>
                </div>
            )}
            {curPage === 'netDetail' && (
                <div className="p-4 font-pixelify-sans h-full flex flex-col font-bold overflow-y-auto w-full [&::-webkit-scrollbar]:hidden" ref={lastRef}>
                    <p className="bg-black font-black text-xl py-2 pl-6 text-orange-500 w-full">
                        CONNECTED STATIONS
                    </p>
                    <div className="h-40 mt-4">
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