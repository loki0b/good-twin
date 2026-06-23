import body from "../assets/body.svg"
import Screen from "./Screen.js"
import Button from "./Button.js"
import { pushButtonBus, switchBus } from "../hooks/inputState.js"

type Bttn = {
    buttonTitle: string,
    isOn: boolean
}

const GoodTwinBody = () => {
    const chekKeyboard = pushButtonBus();
    const checkToggle = switchBus()
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
    const switchData = [
        {
            buttonTitle: 'Q',
            isOn: checkToggle.FREQ
        },
        {
            buttonTitle: 'W',
            isOn: checkToggle.CHN_OPT_1
        },
        {
            buttonTitle: 'E',
            isOn: checkToggle.CHN_OPT_2
        },
        {
            buttonTitle: 'R',
            isOn: checkToggle.CHN_OPT_3
        }
    ]
    return (
        <div 
            className='bg-contain flex static justify-center bg-center h-screen w-full bg-no-repeat'
            style={{ backgroundImage: `url(${body})` }}
        >
            <div className="absolute bottom-64 right-36 flex items-center gap-4">
                <Screen bttns={bttnData} swtch={switchData}/>
                <Button bttnOn={bttnData}/>
            </div>
        </div>
    );
}

export default GoodTwinBody;