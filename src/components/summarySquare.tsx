import { type CorrectGuess } from '@/models/UI/correctGuess';
import React from 'react';
import HeaderSquare from './headerSquare';

interface SummaryProps {
    hidden: boolean,
    correctGuesses: CorrectGuess[]
}

export default function SummarySquare(props: SummaryProps): React.JSX.Element{
    if(props.hidden) return <HeaderSquare text="" imageSource="" imageAltText="" />
    return(
        <div className="flex flex-col">
            <button>Summary</button>
        </div>
    )
}