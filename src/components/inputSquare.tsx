class InputSquareProps{
    topLeftCorner?: boolean;
    topRightCorner?: boolean;
    bottomLeftCorner?: boolean;
    bottomRightCorner?: boolean;
    center?: boolean
}

const defaultProps: InputSquareProps = {
    topLeftCorner: false,
    topRightCorner: false,
    bottomLeftCorner: false,
    bottomRightCorner: false,
    center: false
}

function getPositionalStyleClass(props: InputSquareProps){
    let styleClass = "paper-texture bg-amber-700 square game-border px-10 py-4";
    if(props.bottomLeftCorner) styleClass += " bottom-left";
    if(props.bottomRightCorner) styleClass += " bottom-right";
    if(props.topLeftCorner) styleClass += " top-left";
    if(props.topRightCorner) styleClass += " top-right";
    if(props.center){
        styleClass = styleClass.replace('paper-texture', '').trim();
        styleClass += " input-center bg-auto"
    } 
    return styleClass
}

const InputSquare = (props: InputSquareProps) => {
    const positionalStyle = getPositionalStyleClass(props);
    return (
        <div className={positionalStyle}></div>
    )
}

InputSquare.defaultProps = defaultProps;

export default InputSquare;