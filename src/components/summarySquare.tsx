import { type CorrectGuess } from "@/models/UI/correctGuess";
import React from "react";
import HeaderSquare from "./headerSquare";
import { ThemeProvider, createTheme } from "@mui/material";

interface SummaryProps {
  hidden: boolean;
  correctGuesses: CorrectGuess[];
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const defaultSummaryGrid = [
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
];

function generateSummaryText(correctGuesses: CorrectGuess[]): string {
  const mappedSummaryGrid = defaultSummaryGrid.map((x) => x);
  correctGuesses.forEach((correctGuess) => {
    mappedSummaryGrid[correctGuess.squareIndex] = "✅";
  });
  const resultsGrid = formatGridSummaryToString(mappedSummaryGrid);
  const summaryText = `🧙 Magic: The Griddening Summary 🧙
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
      console.log("added rn to summary grid.");
    }
  }
  console.log(summaryGrid);
  return summaryGrid;
}

export default function SummarySquare(props: SummaryProps): React.JSX.Element {
  if (props.hidden)
    return <HeaderSquare text="" imageSource="" imageAltText="" />;
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="flex">
        <button
          className="m-auto p-2 game-border paper-texture blue-background text-[12px] md:text-md lg:text-lg square"
          onClick={() => {
            const clipboardText = generateSummaryText(props.correctGuesses);
            void navigator.clipboard.writeText(clipboardText);
          }}
        >
          Copy Results
        </button>
      </div>
    </ThemeProvider>
  );
}
