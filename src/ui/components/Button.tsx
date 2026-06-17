import union from "../assets/union.png"
import Arrow from "./Arrow.js"
import rec from "../assets/rec.svg"
import undo from "../assets/undo-2.svg"

const Button = () => {
  return (
    <div 
    className="bg-cover flex static bg-no-repeat bg-center h-75 w-90" 
    style={{ backgroundImage: `url(${union})` }}
    >
        <div className="h-65 w-65 absolute top-4 right-22 border-b-12 border-b-[#D95C03] shadow-md shadow-neutral-500 rounded-full bg-orange-500">
            <div className="absolute top-2 left-22">
                <Arrow direction=""/>
            </div>
            <div className="absolute top-21 left-2">
                <div className="flex">
                    <Arrow direction="rotate-270"/>
                    <div className="drop-shadow-md shadow-neutral-500 h-20 w-20 object-contain bg-no-repeat bg-center" style={{ backgroundImage: `url(${rec})` }}></div>
                    <Arrow direction="rotate-90"/>
                </div>
            </div>
            <div className="absolute bottom-2 left-22">
                <Arrow direction="rotate-180"/>
            </div>
        </div>
        <div className="h-14 w-14 flex justify-center items-center absolute bottom-14 right-8 rounded-full shadow-md shadow-neutral-500 bg-orange-500 border-4 border-[#D95C03]">
            <img src={undo} className="h-6 w-6" alt="undo" />
        </div>
    </div>
  )
}

export default Button