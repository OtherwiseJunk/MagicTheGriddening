"use client";

import { GameState } from "@/models/UI/gameState";
import InputSquare from "./inputSquare";
import { useState } from "react";
import InputDialog from "./inputDialog";

type GameBoardPrompts = {
  gameState: GameState;
  setGameState: Function;
};

const inputSquares = (
  props: GameBoardPrompts,
  handleOpen: Function,
  setDialogIndex: Function
) => {
  return Array.from({ length: 9 }, (value, index) => index).map((_, index) => {
    const correctGuess = props.gameState.correctGuesses.find(
      (correctGuess) => correctGuess.squareIndex === index
    );
    switch (index) {
      case 0:
        return (
          <InputSquare
            key={index}
            topLeftCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
      case 2:
        return (
          <InputSquare
            key={index}
            topRightCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
      case 4:
        return (
          <InputSquare
            key={index}
            center={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
      case 6:
        return (
          <InputSquare
            key={index}
            bottomLeftCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
      case 8:
        return (
          <InputSquare
            key={index}
            bottomRightCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
      default:
        return (
          <InputSquare
            key={index}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
          />
        );
    }
  });
};

export default function GameBoard(props: GameBoardPrompts) {
  const [isOpen, setOpen] = useState(false);
  const [dialogGridIndex, setDialogGridIndex] = useState(-1);
  const handleOpen = () => setOpen(true);
  

  return (
    <div className="grid col-span-3 row-span-3 grid-cols-3 grid-rows-3">
      {inputSquares(props, handleOpen, setDialogGridIndex)}
      {InputDialog({
        isOpen: isOpen,
        setIsOpen: setOpen,
        dialogGridIndex: dialogGridIndex,
        gameState: props.gameState,
        setGameState: props.setGameState,
      })}
    </div>
  );
}
