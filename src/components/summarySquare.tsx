import { type CorrectGuess } from '@/models/UI/correctGuess';
import React from 'react';

interface SummaryProps {
    hidden: boolean,
    correctGuesses: CorrectGuess[]
}

export default function SummarySquare(props: SummaryProps): React.JSX.Element{
    if(props.hidden) return <></>
    return(
        <div className="flex flex-col">
            <button>Summary</button>
        </div>
    )
}