/* eslint-disable @next/next/no-img-element */
import { type CorrectGuess } from '@/models/UI/correctGuess'
import React from 'react';
// import Image from 'next/image';

class InputSquareProps {
  topLeftCorner?: boolean = false
  topRightCorner?: boolean = false
  bottomLeftCorner?: boolean = false
  bottomRightCorner?: boolean = false
  center?: boolean = false
  correctGuess?: CorrectGuess
  handleOpen: () => void = () => {}
  gridIndex: number = -1
  setDialogIndex: (index: number) => void = () => {}
  remainingGuesses: number = -1
}

function getPositionalStyleClass (props: InputSquareProps): string {
  let styleClass = 'paper-texture bg-amber-700 square game-border px-4'
  if (props.bottomLeftCorner ?? false) styleClass += ' bottom-left'
  if (props.bottomRightCorner ?? false) styleClass += ' bottom-right'
  if (props.topLeftCorner ?? false) styleClass += ' top-left'
  if (props.topRightCorner ?? false) styleClass += ' top-right'
  if (props.center ?? false) {
    styleClass = styleClass.replace('paper-texture', '').trim()
    styleClass += ' input-center bg-auto'
  }
  return styleClass
}

export default function InputSquare (props: InputSquareProps): React.JSX.Element {
  const positionalStyle = getPositionalStyleClass(props)
  const liveGameClass = props.remainingGuesses > 0 ? 'live-input' : ''

  if (props.correctGuess !== undefined) {
    return (
      <div className={positionalStyle}>
        <img
          alt={props.correctGuess.cardName}
          src={props.correctGuess.imageUrl}
        />
      </div>
    )
  }

  return <div className={`${positionalStyle} ${liveGameClass}`} onClick={() => {
    props.setDialogIndex(props.gridIndex)
    props.handleOpen()
  }}></div>
}
