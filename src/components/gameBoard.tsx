import Image from "next/image";

export default function GameBoard() {
  return (
    <div className="game-input-board bordered grid col-span-3 row-span-3 grid-cols-3 grid-rows-3 text-4xl">
      <div className="game-border top-left bg-yellow-300  px-12 py-4">
        Primal Command
      </div>
      <div className="bg-amber-900 game-submitted game-border px-12 py-4">
        <Image
          className="logo bordered top-left top-right bottom-left bottom-right"
          src="https://cards.scryfall.io/large/front/8/6/86d6b411-4a31-4bfc-8dd6-e19f553bb29b.jpg"
          alt="Rancor MTG"
          width={190}
          height={210}
        />
      </div>
      <div className="game-border top-right bg-blue-400 px-12 py-4">
        Atraka's Command
      </div>
      <div className="bg-amber-900 game-border px-12 py-4">
        Hour of Reckoning
      </div>
      <div className="bg-amber-900 game-border bg-gray-400  px-12 py-4">
        Concerted Effort
      </div>
      <div className="bg-amber-900 game-border  px-12 py-4">Rain of Embers</div>
      <div className="game-border bottom-left bg-red-400 px-12 py-4">
        Boggart Birth Rite
      </div>
      <div className="bg-amber-900 game-border  px-12 py-4">
        Boggart Shenanigans
      </div>
      <div className="game-border bottom-right bg-green-400 px-12 py-4">
        Goblin Ravenger
      </div>
    </div>
  );
}
