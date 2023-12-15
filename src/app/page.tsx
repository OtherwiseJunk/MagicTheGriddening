import Image from "next/image";
import GameBoard from "../components/gameBoard";

export default function Home() {
  return (
    <div className="h-max w-max logo bordered container text-xl bg-yellow-950 p-5">
      <div className="grid grid-rows-4 grid-cols-5 text-center">
        <div className="p-5 m-auto">
          <Image
            className="logo bordered"
            alt="A blue-skinned character deep in thought."
            src="/logo.png"
            width={128}
            height={128}
          />
        </div>
        <div className="m-auto">Sorcery</div>
        <div className="m-auto">Enchantments</div>
        <div className="p-5 m-auto">
          <Image
            className="logo bordered top-left top-right bottom-left bottom-right"
            alt="A red mana symbol; a poorly drawn fireball sillouhete on a red field."
            src="/mountain.png"
            width={128}
            height={128}
          />
        </div>
        <div className=""></div>
        <div className="p-5 m-auto">
          <Image
            className="logo bordered top-left top-right bottom-left bottom-right"
            alt="A green mana symbol; a poorly drawn tree sillouhete on a green field."
            src="/forest.png"
            width={128}
            height={128}
          />
        </div>
        <GameBoard />
        <div className=""></div>
        <div className="p-5 m-auto">Ravnica: City of Guilds</div>
        <div className="m-auto">Life Points: 9</div>
        <div className="p-5 m-auto">Goblin</div>
        <div className=""></div>
      </div>
      <div className="paperOverlay"></div>
    </div>
  );
}
