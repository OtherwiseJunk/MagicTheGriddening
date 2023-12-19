"use client";

export default function GameBoard() {
  return (
    <div className="grid col-span-3 row-span-3 grid-cols-3 grid-rows-3 text-2xl">
      <div className="bg-amber-700 game-border px-12 py-4 top-left"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 top-right"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 input-center bg-auto"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 bottom-left"></div>
      <div className="bg-amber-700 game-border px-12 py-4"></div>
      <div className="bg-amber-700 game-border px-12 py-4 bottom-right"></div>
    </div>
  );
}
