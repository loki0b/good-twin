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
            isOn: chekKeyboard.RIGHT_BTN && !chekKeyboard.RETURN_BTN
        },
        {
            buttonTitle: 'left',
            isOn: chekKeyboard.LEFT_BTN && !chekKeyboard.ENTER_BNT
        },
        {
            buttonTitle: 'top',
            isOn: chekKeyboard.UP_BTN && !chekKeyboard.ENTER_BNT
        },
        {
            buttonTitle: 'bottom',
            isOn: chekKeyboard.DOWN_BTN && !chekKeyboard.RETURN_BTN
        },
        {
            buttonTitle: 'middle',
            isOn: chekKeyboard.ENTER_BNT && !chekKeyboard.ON_OFF_BNT
        },
        {
            buttonTitle: 'onOff',
            isOn: chekKeyboard.ON_OFF_BNT
        },
        {
            buttonTitle: 'return',
            isOn: chekKeyboard.RETURN_BTN && !chekKeyboard.ON_OFF_BNT
        }
    ]
    return (
        <div 
            className='bg-contain flex static justify-center bg-center h-screen w-full bg-no-repeat'
            style={{ backgroundImage: `url(${body})` }}
        >
            <div className="absolute bottom-64 right-36 flex items-center gap-4">
                <Screen bttns={bttnData}/>
                <Button bttnOn={bttnData}/>
            </div>
        </div>
    );
}

export default GoodTwinBody;