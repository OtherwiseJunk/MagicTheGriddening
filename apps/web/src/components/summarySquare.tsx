import { type CorrectGuess } from "@/models/UI/correctGuess";
import React, { useEffect, useState } from "react";
import HeaderSquare from "./headerSquare";

interface SummaryProps {
  hidden: boolean;
  correctGuesses: CorrectGuess[];
  gameId?: number;
}

interface SquarePicks {
  available: boolean;
  totalPlayers?: number;
  picks?: { card: string; count: number }[];
}

const defaultSummaryGrid = Array(9).fill("🟥");

const defaultTitle = "🧙 Magic: The Griddening Summary 🧙";
const winnerTitle = "✨🧙 Magic: The Griddening Archmage 🧙✨";

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
  const [allPicks, setAllPicks] = useState<(SquarePicks | null)[]>(Array(9).fill(null));
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!props.hidden && props.gameId) {
      Promise.all(
        Array.from({ length: 9 }, (_, i) =>
          fetch(`/api/stats/global/${props.gameId}/${i}`)
            .then((r) => r.json() as Promise<SquarePicks>)
            .catch(() => null),
        ),
      )
        .then(setAllPicks)
        .catch(() => undefined);
    }
  }, [props.hidden, props.gameId]);

  if (props.hidden) return <HeaderSquare text="" imageSource="" imageAltText="" />;

  const hasAnalytics = allPicks.some((p) => p?.available);

  return (
    <div className="flex flex-col items-center gap-3">
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
      {hasAnalytics && (
        <button
          onClick={() => setShowAnalytics((v) => !v)}
          className="text-text-parchment/70 hover:text-gold-leaf text-xs font-[family-name:var(--font-body)] transition-colors"
        >
          {showAnalytics ? "Hide" : "Show"} top picks
        </button>
      )}
      {showAnalytics && hasAnalytics && (
        <div className="grid grid-cols-3 gap-1 text-[10px] font-[family-name:var(--font-body)] w-full">
          {allPicks.map((picks, i) => {
            const userCard = props.correctGuesses.find((g) => g.squareIndex === i)?.cardName;
            const userPick = userCard ? picks?.picks?.find((p) => p.card === userCard) : undefined;
            const pct =
              userPick && picks?.totalPlayers
                ? Math.round((userPick.count / picks.totalPlayers) * 100)
                : null;
            return (
              <div key={i} className="bg-black/20 rounded p-1 text-text-parchment/70">
                {picks?.available && picks.picks?.[0] ? (
                  <>
                    <p className="text-text-gold truncate">{picks.picks[0].card}</p>
                    <p>{picks.picks[0].count}×</p>
                    {pct !== null && (
                      <p className="text-text-parchment/50">{pct}% picked yours</p>
                    )}
                  </>
                ) : (
                  <p className="italic opacity-50">—</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
