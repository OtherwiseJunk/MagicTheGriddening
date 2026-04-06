"use client";

import React, { useRef } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";

export default function RulesDialog(): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="flex flex-col items-center text-text-parchment/80 hover:text-gold-leaf transition-colors mr-4"
        title="How to Play"
      >
        <IoDocumentTextOutline size="2em" />
        <p className="text-sm font-[family-name:var(--font-body)]">Rules</p>
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="bg-transparent p-0 max-w-[90vw] md:max-w-lg backdrop:bg-black/60"
      >
        <div className="paper-texture bg-dark-vellum p-6 md:p-8 bordered border-gold-leaf rounded-xl">
          <h2 className="text-text-gold text-xl md:text-2xl font-semibold mb-4">How to Play</h2>
          <ol className="list-decimal list-inside text-text-parchment font-[family-name:var(--font-body)] text-sm md:text-base space-y-2">
            <li>Each day a new puzzle is generated with a 3x3 grid of squares.</li>
            <li>
              The grid has 3 column constraints across the top and 3 row constraints down the left
              side.
            </li>
            <li>
              Each square must be filled with a Magic: The Gathering card that satisfies{" "}
              <strong className="text-text-gold">both</strong> the column constraint above it and
              the row constraint beside it.
            </li>
            <li>
              Click an empty square to open the search dialog. Type at least 3 characters to trigger
              auto-complete, then select a card.
            </li>
            <li>
              You start with <strong className="text-text-gold">9 life points</strong>. Every guess
              — right or wrong — costs 1 life point.
            </li>
            <li>If your guess is correct, the card&apos;s image is revealed in that square.</li>
            <li>
              Each card can only be used <strong className="text-text-gold">once</strong> per grid —
              no duplicates.
            </li>
            <li>
              When you run out of life points, the game ends and you can copy your results to share.
            </li>
            <li>
              Fill all 9 squares to earn the title of{" "}
              <strong className="text-text-gold">Archmage</strong> with a perfect score.
            </li>
          </ol>
          <p className="text-text-parchment/60 font-[family-name:var(--font-body)] text-xs md:text-sm mt-4 italic">
            Every intersection on the grid is guaranteed to have at least 10 valid cards.
          </p>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => dialogRef.current?.close()}
              className={[
                "px-5 py-2 bg-mana-blue border-2 border-gold-leaf/60 rounded-lg",
                "text-text-parchment font-[family-name:var(--font-body)] font-semibold",
                "hover:border-gold-leaf hover:shadow-[0_0_16px_rgba(201,168,76,0.3)]",
                "active:scale-95 transition-all duration-200",
              ].join(" ")}
            >
              Got it
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
