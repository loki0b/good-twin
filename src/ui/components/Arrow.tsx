import arrow from "../assets/arrow.svg"

const Arrow = ({direction}: {direction: string}) => {
  return (
    <div 
    className={`h-20 drop-shadow-md shadow-neutral-500 bg-contain bg-no-repeat bg-center w-20 ${direction}`}
    style={{ backgroundImage: `url(${arrow})` }}
    >
    </div>
  )
}

export default Arrow