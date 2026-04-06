import { type GameConstraint } from "@/models/UI/gameConstraint";
import { type GameState } from "@/models/UI/gameState";
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

const submitAnswer = async (
  playerId: string,
  squareIndex: number,
  guess: string,
): Promise<boolean> => {
  const response = await fetch("/api/submitAnswer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      squareIndex,
      guess,
    }),
  });

  return response.status === 200;
};

interface InputProps {
  gameState: GameState;
  setGameState: (gameState: GameState) => void;
  dialogGridIndex: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function InputDialog(props: InputProps): React.JSX.Element {
  const [cardOptions, setCardOptions] = useState([] as string[]);
  const [currentValue, setCurrentValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback((): void => {
    props.setIsOpen(false);
    setCardOptions([]);
    setCurrentValue("");
    setHighlightedIndex(-1);
    setShowDropdown(false);
    dialogRef.current?.close();
  }, [props]);

  useEffect(() => {
    if (props.isOpen) {
      dialogRef.current?.showModal();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      dialogRef.current?.close();
    }
  }, [props.isOpen]);

  const updateCardOptions = async (newValue: string): Promise<void> => {
    setCurrentValue(newValue);
    setHighlightedIndex(-1);

    if (newValue.length >= 3) {
      await ScryfallService.getCards(newValue).then((foundCards: Card[]) => {
        const options = foundCards
          .map((card) => card.name)
          .filter((cardName) => cardName.toLowerCase().includes(newValue.toLowerCase()));
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

  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let storedUserId: string | null = localStorage.getItem("griddening.userId");
    if (storedUserId == null) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem("griddening.userId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="bg-transparent p-0 max-w-[90vw] md:max-w-lg"
    >
      <div className="paper-texture bg-dark-vellum p-5 md:p-8 bordered border-gold-leaf rounded-xl">
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
                "absolute z-50 w-full mt-1 max-h-48",
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (currentValue.length > 0) {
                void submitAnswer(userId, props.dialogGridIndex, currentValue).then(() => {
                  handleClose();
                  props.setGameState({
                    ...props.gameState,
                    lifePoints: props.gameState.lifePoints - 1,
                  });
                });
              }
            }}
            className={[
              "px-6 py-2 bg-mana-blue",
              "border-2 border-gold-leaf/60 rounded-lg",
              "text-text-parchment",
              "font-[family-name:var(--font-body)]",
              "font-semibold tracking-wide",
              "hover:border-gold-leaf",
              "hover:shadow-[0_0_16px_rgba(201,168,76,0.3)]",
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
