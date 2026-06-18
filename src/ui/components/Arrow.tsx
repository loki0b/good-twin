
const Arrow = ({image, pressed}: {image: string, pressed: boolean}) => {
  return (
    <div 
    className={`h-20 ${pressed && 'translate-y-1'} flex justify-center items-center w-20`}
    >
        <img src={image} alt="arrow" />
    </div>
  )
}

export default Arrow