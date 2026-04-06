import { type CorrectGuess } from "@/models/UI/correctGuess";
import React from "react";
import HeaderSquare from "./headerSquare";

interface SummaryProps {
  hidden: boolean;
  correctGuesses: CorrectGuess[];
}

const defaultSummaryGrid = Array(9).fill("🟥");

const defaultTitle = '🧙 Magic: The Griddening Summary 🧙';
const winnerTitle = '✨🧙 Magic: The Griddening Archmage 🧙✨'

function generateSummaryText(correctGuesses: CorrectGuess[]): string {
  const title = correctGuesses.length === 9 ? winnerTitle : defaultTitle;
  const mappedSummaryGrid: string[] = defaultSummaryGrid.map((x) => x);
  correctGuesses.forEach((correctGuess) => {
    mappedSummaryGrid[correctGuess.squareIndex] = "✅";
  });
  const resultsGrid = formatGridSummaryToString(mappedSummaryGrid);
  const summaryText = `${title}
Score: ${correctGuesses.length}/9

${resultsGrid}

Play at: https://magicthegridden.ing/`;

  return summaryText;
}

function formatGridSummaryToString(gridSummary: string[]): string {
  let summaryGrid = "";
  for (let i = 0; i < 9; i++) {
    summaryGrid += `${gridSummary[i]} `;
    if ((i + 1) % 3 === 0) {
      summaryGrid += "\r\n";
    }
  }
  return summaryGrid;
}

export default function SummarySquare(props: SummaryProps): React.JSX.Element {
  if (props.hidden)
    return <HeaderSquare text="" imageSource="" imageAltText="" />;
  return (
    <div className="flex">
      <button
        className={[
          "m-auto p-2 game-border bordered",
          "paper-texture blue-background",
          "text-[12px] md:text-md lg:text-lg square",
          "border-gold-leaf hover:shadow-card-hover",
          "transition-all duration-200",
          "font-[family-name:var(--font-body)]",
        ].join(" ")}
        onClick={() => {
          const clipboardText = generateSummaryText(props.correctGuesses);
          void navigator.clipboard.writeText(clipboardText);
        }}
      >
        Copy Results
      </button>
    </div>
  );
}
