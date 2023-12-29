import { type CorrectGuess } from '@/models/UI/correctGuess'

class InputSquareProps {
  topLeftCorner?: boolean = false
  topRightCorner?: boolean = false
  bottomLeftCorner?: boolean = false
  bottomRightCorner?: boolean = false
  center?: boolean = false
  correctGuess?: CorrectGuess
  handleOpen: Function = () => {}
  gridIndex: number = -1
  setDialogIndex: Function = () => {}
  remainingGuesses: number = -1
}

function getPositionalStyleClass (props: InputSquareProps) {
  let styleClass = 'paper-texture bg-amber-700 square game-border px-4'
  if (props.bottomLeftCorner) styleClass += ' bottom-left'
  if (props.bottomRightCorner) styleClass += ' bottom-right'
  if (props.topLeftCorner) styleClass += ' top-left'
  if (props.topRightCorner) styleClass += ' top-right'
  if (props.center) {
    styleClass = styleClass.replace('paper-texture', '').trim()
    styleClass += ' input-center bg-auto'
  }
  return styleClass
}

export default function InputSquare (props: InputSquareProps) {
  const positionalStyle = getPositionalStyleClass(props)
  const liveGameClass = props.remainingGuesses > 0 ? 'live-input' : ''

  if (props.correctGuess) {
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
