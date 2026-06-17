"use client";

import { GameState } from "@/models/UI/gameState";
import React, { useEffect, useState } from "react";
import GameBoard from "./gameBoard";
import HeaderSquare from "./headerSquare";
import SummarySquare from "./summarySquare";
import { type GameConstraint } from "@griddening/shared";
import { usePlayer } from "@/contexts/playerContext";

export default function Game(): React.JSX.Element {
  const { userId } = usePlayer();
  const [gameState, setGameState] = useState<GameState>(new GameState([], -1, []));

  async function getGameState(id: string): Promise<void> {
    const res = await fetch(`/api/gameState/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data: GameState = await res.json();
    setGameState(new GameState(data.gameConstraints, data.lifePoints, data.correctGuesses));
  }

  useEffect(() => {
    if (userId !== "") {
      void getGameState(userId);
    }
  }, [userId]);

  const lifePointsString = `Life Points: ${gameState.lifePoints}`;
  const gameConstraints: GameConstraint[] = gameState.gameConstraints;
  const summaryHidden = gameState.lifePoints > 0;
  const infoBarClasses =
    "paper-texture m-auto max-h-max max-w-max logo bordered container p-2 lg:p-5 w-screen grid grid-rows-1 grid-cols-2 lg:text-[20px]";
  let lifeAndSummary: React.JSX.Element;
  if (summaryHidden) {
    lifeAndSummary = (
      <div className={infoBarClasses}>
        <div className="m-auto whitespace-nowrap w-[18rem] lg:w-[28rem] col-span-2">
          <HeaderSquare text={lifePointsString} imageSource="" imageAltText="" />
        </div>
      </div>
    );
  } else {
    lifeAndSummary = (
      <div className={infoBarClasses}>
        <div className="m-auto w-56">
          <HeaderSquare text={lifePointsString} imageSource="" imageAltText="" />
        </div>
        <div className="w-56">
          <SummarySquare
            hidden={summaryHidden}
            correctGuesses={gameState.correctGuesses}
            gameId={gameState.gameId}
          ></SummarySquare>
        </div>
      </div>
    );
  }

  return (
    <div className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto">
      {lifeAndSummary}
      <br />
      <div className="paper-texture m-auto max-h-max max-w-max logo bordered container p-2 lg:p-5 lg:pr-16 lg:pb-10">
        <div className="grid grid-rows-4 grid-cols-4 text-center">
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
          <HeaderSquare
            text={gameConstraints[3]?.displayName}
            imageSource={gameConstraints[3]?.imageSrc}
            imageAltText={gameConstraints[3]?.imageAltText}
          />
          <GameBoard userId={userId} gameState={gameState} setGameState={setGameState} />
          <HeaderSquare
            text={gameConstraints[4]?.displayName}
            imageSource={gameConstraints[4]?.imageSrc}
            imageAltText={gameConstraints[4]?.imageAltText}
          />
          <HeaderSquare
            text={gameConstraints[5]?.displayName}
            imageSource={gameConstraints[5]?.imageSrc}
            imageAltText={gameConstraints[5]?.imageAltText}
          />
        </div>
      </div>
    </div>
  );
}
