import Image from "next/image";

function getColorClassByIndex(index: number) {
  let colorClass = "";
  switch (index) {
    case 0:
      colorClass = "bg-yellow-300";
      break;
    case 2:
      colorClass = "bg-blue-600";
      break;
    case 4:
      colorClass = "bg-gray-600";
      break;
    case 6:
      colorClass = "bg-red-600";
      break;
    case 8:
      colorClass = "bg-green-600";
      break;
    default:
      colorClass = "bg-amber-600";
      break;
  }
  return colorClass;
}

export default function GameBoard() {
  const numberOfSquares = 9;
  return (
    <div className="game-input-board bordered grid col-span-3 row-span-3 grid-cols-3 grid-rows-3 text-2xl">
      <div className="bg-amber-700 game-border px-12 py-4 top-left"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 top-right"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 input-center bg-auto"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 bottom-left"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 bottom-right"></div>
    </div>
  );
}
