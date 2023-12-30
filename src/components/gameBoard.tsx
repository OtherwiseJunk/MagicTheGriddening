'use client'

import { type GameState } from '@/models/UI/gameState'
import InputSquare from './inputSquare'
import React, { useState } from 'react'
import InputDialog from './inputDialog'

interface GameBoardPrompts {
  gameState: GameState
  setGameState: (gameState: GameState) => void
}

const inputSquares = (
  props: GameBoardPrompts,
  handleOpen: () => void,
  setDialogIndex: (index: number) => void
):React.JSX.Element[] => {
  return Array.from({ length: 9 }, (value, index) => index).map((_, index) => {
    const correctGuess = props.gameState.correctGuesses.find(
      (correctGuess) => correctGuess.squareIndex === index
    )
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
            remainingGuesses={props.gameState.lifePoints}
          />
        )
      case 2:
        return (
          <InputSquare
            key={index}
            topRightCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
            remainingGuesses={props.gameState.lifePoints}
          />
        )
      case 4:
        return (
          <InputSquare
            key={index}
            center={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
            remainingGuesses={props.gameState.lifePoints}
          />
        )
      case 6:
        return (
          <InputSquare
            key={index}
            bottomLeftCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
            remainingGuesses={props.gameState.lifePoints}
          />
        )
      case 8:
        return (
          <InputSquare
            key={index}
            bottomRightCorner={true}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
            remainingGuesses={props.gameState.lifePoints}
          />
        )
      default:
        return (
          <InputSquare
            key={index}
            correctGuess={correctGuess}
            handleOpen={handleOpen}
            gridIndex={index}
            setDialogIndex={setDialogIndex}
            remainingGuesses={props.gameState.lifePoints}
          />
        )
    }
  })
}

export default function GameBoard (props: GameBoardPrompts): React.JSX.Element {
  const [isOpen, setOpen] = useState(false)
  const [dialogGridIndex, setDialogGridIndex] = useState(-1)
  const handleOpen = (): void => { setOpen(props.gameState.lifePoints > 0) }

  return (
    <div className="grid col-span-3 row-span-3 grid-cols-3 grid-rows-3">
      {inputSquares(props, handleOpen, setDialogGridIndex)}
      {InputDialog({
        isOpen,
        setIsOpen: setOpen,
        dialogGridIndex,
        gameState: props.gameState,
        setGameState: props.setGameState
      })}
    </div>
  )
}
