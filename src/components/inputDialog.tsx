import { type GameConstraint } from "@/models/UI/gameConstraint";
import { type CorrectGuess } from "@/models/UI/correctGuess";
import { GameState } from "@/models/UI/gameState";
import ScryfallService from "@/services/scryfall.service";
import GriddeningService from "@/services/griddening.service";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type Card } from "scryfall-sdk";

const getConstraintsText = (constraints: GameConstraint[], squareIndex: number): string => {
  const [constraintOne, constraintTwo] = GriddeningService.getGameConstraintsForIndex(
    constraints,
    squareIndex,
  );
  return constraintOne !== undefined
    ? GriddeningService.getTextForConstraints(constraintOne, constraintTwo)
    : "";
};

interface SubmitResult {
  outcome: "correct" | "duplicate" | "incorrect" | "error";
  lifePoints?: number;
  correctGuess?: CorrectGuess;
}

const submitAnswer = async (
  playerId: string,
  squareIndex: number,
  guess: string,
): Promise<SubmitResult> => {
  const response = await fetch("/api/submitAnswer", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      squareIndex,
      guess,
    }),
  });

  const isJsonResponse = response.headers.get("Content-Type")?.includes("application/json") ?? false;
  const responseBody = isJsonResponse ? ((await response.json()) as Partial<SubmitResult>) : undefined;

  if (response.status === 200 && responseBody?.lifePoints !== undefined) {
    return {
      outcome: "correct",
      lifePoints: responseBody.lifePoints,
      correctGuess: responseBody.correctGuess,
    };
  }

  if (response.status === 409) {
    return { outcome: "duplicate" };
  }

  if (response.status === 422 && responseBody?.lifePoints !== undefined) {
    return {
      outcome: "incorrect",
      lifePoints: responseBody.lifePoints,
    };
  }

  return { outcome: "error" };
};

interface InputProps {
  userId: string;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  dialogGridIndex: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function InputDialog(props: InputProps): React.JSX.Element {
  const [cardOptions, setCardOptions] = useState([] as string[]);
  const [currentValue, setCurrentValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  const handleClose = useCallback((): void => {
    props.setIsOpen(false);
    setCardOptions([]);
    setCurrentValue("");
    setHighlightedIndex(-1);
    setShowDropdown(false);
    setErrorMessage("");
    if (dialogRef.current?.open === true) {
      dialogRef.current.close();
    }
  }, [props]);

  useEffect(() => {
    if (props.isOpen) {
      if (dialogRef.current?.open !== true) {
        dialogRef.current?.showModal();
      }
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(focusTimer);
    } else {
      if (dialogRef.current?.open === true) {
        dialogRef.current.close();
      }
    }
  }, [props.isOpen]);

  const updateCardOptions = async (newValue: string): Promise<void> => {
    setCurrentValue(newValue);
    setHighlightedIndex(-1);
    latestQueryRef.current = newValue;

    if (newValue.length >= 3) {
      await ScryfallService.getCards(newValue).then((foundCards: Card[]) => {
        if (latestQueryRef.current !== newValue) {
          return;
        }
        const normalizedValue = newValue.toLowerCase();
        const options = foundCards
          .map((card) => card.name)
          .filter((cardName) => cardName.toLowerCase().includes(normalizedValue))
          .sort((left, right) => {
            const leftExactMatch = left.toLowerCase() === normalizedValue;
            const rightExactMatch = right.toLowerCase() === normalizedValue;

            if (leftExactMatch !== rightExactMatch) {
              return leftExactMatch ? -1 : 1;
            }

            return left.localeCompare(right);
          });
        setCardOptions(options);
        setShowDropdown(options.length > 0);
      });
    } else {
      setCardOptions([]);
      setShowDropdown(false);
    }
  };

  const selectOption = (option: string): void => {
    setCurrentValue(option);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < cardOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : cardOptions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectOption(cardOptions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose();
        }
      }}
      className="bg-transparent p-0 max-w-[90vw] md:max-w-lg overflow-visible border-none backdrop:bg-black/60"
    >
      <div className="paper-texture relative overflow-visible bg-dark-vellum p-5 md:p-8 bordered border-gold-leaf rounded-xl">
        {/* Constraint Label */}
        <label className="block text-text-gold text-sm md:text-lg font-[family-name:var(--font-body)] font-semibold mb-4 input-label">
          {getConstraintsText(props.gameState.gameConstraints, props.dialogGridIndex)}
        </label>

        {/* Search Input + Dropdown */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => {
              void updateCardOptions(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search for a card..."
            className={[
              "w-full px-4 py-3 bg-parchment-brown/80",
              "border-2 border-gold-leaf/40 rounded-lg",
              "text-text-parchment placeholder:text-text-parchment/40",
              "font-[family-name:var(--font-body)] text-sm md:text-base",
              "focus:outline-none focus:border-gold-leaf",
              "focus:shadow-[0_0_12px_rgba(201,168,76,0.3)]",
              "transition-all",
            ].join(" ")}
          />

          {/* Dropdown */}
          {showDropdown && (
            <ul
              className={[
                "absolute left-0 top-full z-50 w-full mt-1 max-h-[40vh]",
                "overflow-y-auto bg-dark-vellum",
                "border-2 border-gold-leaf/30 rounded-lg",
                "shadow-[0_8px_24px_rgba(0,0,0,0.6)]",
              ].join(" ")}
            >
              {cardOptions.map((option, index) => (
                <li
                  key={option}
                  onClick={() => {
                    selectOption(option);
                  }}
                  className={[
                    "px-4 py-2 cursor-pointer",
                    "text-text-parchment",
                    "font-[family-name:var(--font-body)]",
                    "text-sm md:text-base transition-colors",
                    index === highlightedIndex
                      ? "bg-amber-glow/60 text-white"
                      : "hover:bg-amber-glow/30",
                  ].join(" ")}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error Message */}
        {errorMessage !== "" && (
          <p className="text-red-400 text-sm font-[family-name:var(--font-body)] mb-3">
            {errorMessage}
          </p>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (props.userId === "") {
                setErrorMessage("Your session is still initializing. Please try again in a moment.");
                return;
              }

              if (currentValue.length > 0) {
                setErrorMessage("");
                void submitAnswer(props.userId, props.dialogGridIndex, currentValue).then((result) => {
                  if (result.outcome === "duplicate") {
                    setErrorMessage("You've already used that card — try a different one!");
                    return;
                  }

                  if (result.outcome === "error" || result.lifePoints === undefined) {
                    setErrorMessage("Something went wrong submitting that guess. Please try again.");
                    return;
                  }

                  props.setGameState((currentGameState) => {
                    const submittedGuess = result.correctGuess;
                    const nextCorrectGuesses =
                      submittedGuess === undefined
                        ? currentGameState.correctGuesses
                        : currentGameState.correctGuesses
                            .filter(
                              (correctGuess) =>
                                correctGuess.squareIndex !== submittedGuess.squareIndex &&
                                correctGuess.cardName !== submittedGuess.cardName,
                            )
                            .concat(submittedGuess)
                            .sort((left, right) => left.squareIndex - right.squareIndex);

                    return new GameState(
                      currentGameState.gameConstraints,
                      result.lifePoints,
                      nextCorrectGuesses,
                    );
                  });

                  handleClose();
                });
              }
            }}
            disabled={props.userId === ""}
            className={[
              "px-6 py-2 bg-mana-blue",
              "border-2 border-gold-leaf/60 rounded-lg",
              "text-text-parchment",
              "font-[family-name:var(--font-body)]",
              "font-semibold tracking-wide",
              "hover:border-gold-leaf",
              "hover:shadow-[0_0_16px_rgba(201,168,76,0.3)]",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none",
              "active:scale-95 transition-all duration-200",
            ].join(" ")}
          >
            Submit
          </button>
        </div>
      </div>
    </dialog>
  );
}
