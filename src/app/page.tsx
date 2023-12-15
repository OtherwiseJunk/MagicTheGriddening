import Image from "next/image";
import GameBoard from "../components/gameBoard";

export default function Home() {
  return (
    <div className="container bg-amber-900 flex justify-content-center align-items-center">
      <div className="grid grid-rows-4 grid-cols-5 text-center">
        <div className="p-10">
          <Image
            className="logo bordered"
            alt="A blue-skinned character deep in thought."
            src="/logo.png"
            width={300}
            height={300}
          />
        </div>
        <div className="text-4xl m-auto">Sorcery</div>
        <div className="text-4xl m-auto">Enchantments</div>
        <div className="p-10">
          <Image
            className="logo bordered top-left top-right bottom-left bottom-right"
            alt="A red mana symbol; a poorly drawn fireball sillouhete on a red field."
            src="/mountain.png"
            width={300}
            height={300}
          />
        </div>
        <div className=""></div>
        <div className="p-10">
          <Image
            className="logo bordered top-left top-right bottom-left bottom-right"
            alt="A green mana symbol; a poorly drawn tree sillouhete on a green field."
            src="/forest.png"
            width={300}
            height={300}
          />
        </div>
        <GameBoard />
        <div className=""></div>
        <div className="text-4xl m-auto">Ravnica: City of Guilds</div>
        <div className="text-4xl m-auto">Life Points: 0</div>
        <div className="text-4xl m-auto">Goblin</div>
        <div className=""></div>
      </div>
      <div className="paperOverlay"></div>
    </div>
  );
}
