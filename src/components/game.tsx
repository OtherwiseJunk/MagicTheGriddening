"use client";

import { GameState } from "@/models/UI/gameState";
import React, { useEffect, useState } from "react";
import GameBoard from "./gameBoard";
import HeaderSquare from "./headerSquare";
import SummarySquare from "./summarySquare";
import { type GameConstraint } from "@/models/UI/gameConstraint";

export default function Game(): React.JSX.Element {
  const [gameState, setGameState] = useState<GameState>(
    new GameState([], -1, [])
  );
  const [userId, setUserId] = useState<string>('');
  async function getGameState(userId: string): Promise<void> {
    await fetch(`/api/gameState/${userId}`)
      .then(async (res) => await res.json())
      .then((data: GameState) => {
        setGameState(data);
      });
  }

  useEffect(() =>{
    let storedUserId: string | null = localStorage.getItem('griddening.userId');
    if(storedUserId == null){
      storedUserId = crypto.randomUUID()
      localStorage.setItem('griddening.userId', storedUserId);
    }

    setUserId(storedUserId);
  }, [])

  useEffect(() => {
    if(userId !== ''){
      void getGameState(userId);
    }    
  }, [gameState.lifePoints, userId]);

  const lifePointsString = `Life Points: ${gameState.lifePoints}`;
  const gameConstraints: GameConstraint[] = gameState.gameConstraints;

  return (
    <div className="paper-texture
    m-auto
    max-h-max
    max-w-max
    logo bordered
    container
    text-[10px]
    md:text-l
    lg:text-xl
  bg-yellow-950
    p-2
    lg:p-5"
    >
      <div className="grid grid-rows-4 grid-cols-5 text-center">
        <HeaderSquare
          text=""
          imageSource="/logo.png"
          imageAltText="A blue-skinned character deep in thought."
        />
        <HeaderSquare
          text={gameConstraints[0]?.displayName}
          imageSource={gameConstraints[0]?.imageSrc}
          imageAltText={gameConstraints[0]?.imageAltText}
        />
        <HeaderSquare
          text={gameConstraints[1]?.displayName}
          imageSource={gameConstraints[1]?.imageSrc}
          imageAltText={gameConstraints[1]?.imageAltText}
        />
        <HeaderSquare
          text={gameConstraints[2]?.displayName}
          imageSource={gameConstraints[2]?.imageSrc}
          imageAltText={gameConstraints[2]?.imageAltText}
        />
        <SummarySquare hidden={gameState.lifePoints > 0} correctGuesses={gameState.correctGuesses}></SummarySquare>
        <HeaderSquare
          text={gameConstraints[3]?.displayName}
          imageSource={gameConstraints[3]?.imageSrc}
          imageAltText={gameConstraints[3]?.imageAltText}
        />
        <GameBoard gameState={gameState} setGameState={setGameState} />
        <HeaderSquare text="" imageSource="" imageAltText="" />
        <HeaderSquare
          text={gameConstraints[4]?.displayName}
          imageSource={gameConstraints[4]?.imageSrc}
          imageAltText={gameConstraints[4]?.imageAltText}
        />
        <HeaderSquare text={lifePointsString} imageSource="" imageAltText="" />
        <HeaderSquare
          text={gameConstraints[5]?.displayName}
          imageSource={gameConstraints[5]?.imageSrc}
          imageAltText={gameConstraints[5]?.imageAltText}
        />
        <HeaderSquare text="" imageSource="" imageAltText="" />
      </div>
    </div>
  );
}
