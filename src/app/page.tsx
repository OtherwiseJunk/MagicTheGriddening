import Image from "next/image";

export default function Home() {
  return (
    <div className="container items-center">
      <div className="grid grid-rows-4 grid-cols-5 text-center">
        <div className="bg-purple-400">
          <Image
            alt="A blue-skinned character deep in thought."
            src="/logo.png"
            width={300}
            height={300}
          />
        </div>
        <div className="align-content-center outline outline-1">Sorcery</div>
        <div className="outline outline-1">Enchantments</div>
        <div className="outline outline-1">Red</div>
        <div className="outline outline-1"></div>
        <div className="outline outline-1">Green</div>
        <div className="outline outline-1 grid col-span-3 row-span-3 grid-cols-3 grid-rows-3">
          <div className="bg-yellow-400 outline outline-1 text-black">
            Primal Command
          </div>
          <div className="outline outline-1 center-content">
            <Image
              src="https://cards.scryfall.io/large/front/8/6/86d6b411-4a31-4bfc-8dd6-e19f553bb29b.jpg"
              alt="Rancor MTG"
              width={100}
              height={100}
            />
          </div>
          <div className="bg-blue-800 outline outline-1">Atraka's Command</div>
          <div className="outline outline-1">Hour of Reckoning</div>
          <div className="bg-gray-800 outline outline-1">Concerted Effort</div>
          <div className="outline outline-1">Rain of Embers</div>
          <div className="bg-red-800 outline outline-1">Boggart Birth Rite</div>
          <div className="outline outline-1">Boggart Shenanigans</div>
          <div className="bg-green-800 outline outline-1">Goblin Ravenger</div>
        </div>
        <div className="outline outline-1">Some Stat 1</div>
        <div className="outline outline-1">Ravnica: City of Guilds</div>
        <div className="outline outline-1">Some Stat 2</div>
        <div className="outline outline-1">Goblin</div>
        <div className="outline outline-1">Life Points: 0</div>
      </div>
    </div>
  );
}
