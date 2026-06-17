import Arrow from "./Arrow.js"
import union from "../assets/union.png"
import top from "../assets/arrow-top.png"
import bottom from "../assets/arrow-bttm.png"
import left from "../assets/arrow-left.png"
import right from "../assets/arrow-right.png"
import middle from "../assets/bootom-mddl.png"
import rec from "../assets/rec.svg"
import undo from "../assets/undo-2.svg"

type Bttn = {
    buttonTitle: string,
    isOn: boolean
}

const Button = ({bttnOn}: {bttnOn: Bttn[]}) => {
  return (
    <div 
    className="bg-cover flex static bg-no-repeat bg-center h-75 w-90" 
    style={{ backgroundImage: `url(${union})` }}
    >
        <div className="h-65 w-65 absolute top-4 right-22 border-b-12 border-b-[#D95C03] shadow-md shadow-neutral-500 rounded-full bg-orange-500">
            <div className="absolute top-2 left-23">
                <Arrow image={top} pressed={bttnOn[2].isOn}/>
            </div>
            <div className="absolute top-21 left-3">
                <div className="flex">
                    <Arrow image={left} pressed={bttnOn[1].isOn}/>
                    <Arrow image={middle} pressed={bttnOn[4].isOn}/>
                    <Arrow image={right} pressed={bttnOn[0].isOn}/>
                </div>
            </div>
            <div className="absolute bottom-2 left-23">
                <Arrow image={bottom} pressed={bttnOn[3].isOn}/>
            </div>
        </div>
        <div className={`${bttnOn[6].isOn && 'translate-y-1'} h-14 w-14 flex justify-center items-center absolute bottom-14 right-8 rounded-full shadow-md shadow-neutral-500 bg-orange-500 border-4 border-[#D95C03]`}>
            <img src={undo} className="h-6 w-6" alt="undo" />
        </div>
    </div>
  )
}

export default Button