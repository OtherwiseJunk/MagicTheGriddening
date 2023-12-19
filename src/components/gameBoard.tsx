"use client";

export default function GameBoard() {
  return (
    <div className="grid col-span-3 row-span-3 grid-cols-3 grid-rows-3">
      <div className="bg-amber-700 square game-border px-10 py-4 top-left"></div>
      <div className="bg-amber-700 square game-border px-10 py-4"></div>
      <div className="bg-amber-700 square game-border px-10 py-4 top-right"></div>
      <div className="bg-amber-700 square game-border px-10 py-4"></div>
      <div className="bg-amber-700 square game-border px-10 py-4 input-center bg-auto"></div>
      <div className="bg-amber-700 square game-border px-10 py-4"></div>
      <div className="bg-amber-700 square game-border px-10 py-4 bottom-left"></div>
      <div className="bg-amber-700 square game-border px-10 py-4"></div>
      <div className="bg-amber-700 square game-border px-10 py-4 bottom-right"></div>
    </div>
  );
}
