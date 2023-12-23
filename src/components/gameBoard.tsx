"use client";

import InputSquare from "./inputSquare";

export default function GameBoard() {
  const inputSquares = Array.from({ length: 9 }, (value, index) => index).map((_, index)=>{
    switch(index){
      case 0:
        return <InputSquare topLeftCorner={true} />
      case 2:
        return <InputSquare topRightCorner={true} />
      case 4:
        return <InputSquare center={true}/>
      case 6:
        return <InputSquare bottomLeftCorner={true} />
      case 8:
        return <InputSquare bottomRightCorner={true} />
      default:
        return <InputSquare/>
    }
  })
  return (
    <div className="grid col-span-3 row-span-3 grid-cols-3 grid-rows-3">
      {inputSquares}
    </div>
  );
}
