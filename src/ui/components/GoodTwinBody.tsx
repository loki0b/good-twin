import body from "../assets/body.svg"
import Screen from "./Screen.js"
import Button from "./Button.js"
import { pushButtonBus } from "../hooks/inputState.js"

type Bttn = {
    buttonTitle: string,
    isOn: boolean
}

const GoodTwinBody = () => {
    const chekKeyboard = pushButtonBus();
    const bttnData = [
        {
            buttonTitle: 'right',
            isOn: chekKeyboard.RIGHT_BTN
        },
        {
            buttonTitle: 'left',
            isOn: chekKeyboard.LEFT_BTN
        },
        {
            buttonTitle: 'top',
            isOn: chekKeyboard.UP_BTN
        },
        {
            buttonTitle: 'bottom',
            isOn: chekKeyboard.DOWN_BTN
        },
        {
            buttonTitle: 'middle',
            isOn: chekKeyboard.ENTER_BNT
        },
        {
            buttonTitle: 'onOff',
            isOn: chekKeyboard.ON_OFF_BNT
        },
        {
            buttonTitle: 'return',
            isOn: chekKeyboard.RETURN_BTN
        }
    ]
    return (
        <div 
            className='bg-contain flex static justify-center bg-center h-screen w-full bg-no-repeat'
            style={{ backgroundImage: `url(${body})` }}
        >
            <div className="absolute bottom-54 right-36 flex items-center gap-4">
                <Screen/>
                <Button bttnOn={bttnData}/>
            </div>
        </div>
    );
}

export default GoodTwinBody;