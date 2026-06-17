import body from "../assets/body.svg"
import Screen from "./Screen.js"
import Button from "./Button.js"

const GoodTwinBody = () => {

    return (
        <div 
            className='bg-contain flex static justify-center bg-center h-screen w-full bg-no-repeat'
            style={{ backgroundImage: `url(${body})` }}
        >
            <div className="absolute bottom-54 right-36 flex items-center gap-4">
                <Screen/>
                <Button />
            </div>
        </div>
    );
}

export default GoodTwinBody;