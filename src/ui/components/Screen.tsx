import { useState } from "react";
import { pushButtonBus } from "../hooks/inputState.js"
import raven from "../assets/raven.png"

type PageView = 'start' | 'scanning' | 'netList' | 'netConfig' | 'netDetail';

interface StatePage {
    id: number;
    page: PageView;
}


const Screen = () => {
    const keyBoardKeys = pushButtonBus();
    const [curPage, setCurrPage] = useState<PageView>('start');

    const statePages: StatePage[] = [
        { id: 1, page: 'start' },
        { id: 2, page: 'scanning' },
        { id: 3, page: 'netList' },
        { id: 4, page: 'netConfig' },
        { id: 5, page: 'netDetail' }
    ];

    const goToPage = (pageName: PageView) => setCurrPage(pageName);
  return (
    <div className='w-141.75 h-71.75 bg-orange-500 border-8 border-black'>
        {
            curPage === "start" && (
                <div
                className="w-full object-cover"
                style={{ backgroundImage: `url(${raven})` }}
                >

                </div>
            )
        }
    </div>
  )
}

export default Screen