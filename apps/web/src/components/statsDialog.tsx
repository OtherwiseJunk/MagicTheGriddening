"use client";

import React, { useEffect, useRef, useState } from "react";
import { IoCopyOutline } from "react-icons/io5";
import { usePlayer } from "@/contexts/playerContext";
import { type PlayerStats } from "@/models/UI/playerStats";

export default function StatsDialog(): React.JSX.Element {
  const { statsOpen, closeStats, userId, shortCode, shortCodeError, restorePlayer } = usePlayer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (statsOpen) {
      setStats(null);
      setRestoreError("");
      dialogRef.current?.showModal();
      if (userId) {
        fetch(`/api/stats/${userId}`)
          .then((r) => r.json())
          .then((data: PlayerStats) => setStats(data))
          .catch(() => undefined);
      }
    } else {
      dialogRef.current?.close();
    }
  }, [statsOpen, userId]);

  async function handleRestore() {
    setRestoreError("");
    const res = await fetch("/api/session/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortCode: restoreCode.trim().toUpperCase() }),
    });
    if (!res.ok) {
      setRestoreError("Code not found. Check the code and try again.");
      return;
    }
    const data = (await res.json()) as { playerId: string };
    closeStats();
    restorePlayer(data.playerId);
  }

  const maxScore = stats ? Math.max(...stats.scoreDistribution, 1) : 1;

  const btnClass = [
    "px-4 py-1.5 bg-mana-blue border-2 border-gold-leaf/60 rounded-lg",
    "text-text-parchment font-[family-name:var(--font-body)] font-semibold text-sm",
    "hover:border-gold-leaf hover:shadow-[0_0_16px_rgba(201,168,76,0.3)]",
    "active:scale-95 transition-all duration-200",
  ].join(" ");

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeStats();
      }}
      className="bg-transparent p-0 max-w-[90vw] md:max-w-lg backdrop:bg-black/60"
    >
      <div className="paper-texture bg-dark-vellum p-6 md:p-8 bordered border-gold-leaf rounded-xl space-y-5">
        <h2 className="text-text-gold text-xl md:text-2xl font-semibold">Your Stats</h2>

        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                ["Games Played", stats.gamesPlayed],
                ["Completed", stats.gamesCompleted],
                ["Current Streak", stats.currentStreak],
                ["Best Streak", stats.bestStreak],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-black/20 rounded-lg p-3">
                  <p className="text-text-gold text-2xl font-bold">{value}</p>
                  <p className="text-text-parchment/70 text-xs font-[family-name:var(--font-body)]">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-text-parchment/80 text-sm mb-2 font-[family-name:var(--font-body)]">
                Score Distribution
              </p>
              <div className="space-y-1">
                {stats.scoreDistribution.map((count, score) => (
                  <div
                    key={score}
                    className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]"
                  >
                    <span className="text-text-parchment/60 w-4 text-right">{score}</span>
                    <div
                      className="bg-mana-blue rounded h-5 flex items-center px-1.5 text-text-parchment transition-all"
                      style={{ width: `${Math.max((count / maxScore) * 100, count > 0 ? 8 : 2)}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-text-parchment/60 text-sm font-[family-name:var(--font-body)]">
            Loading stats…
          </p>
        )}

        {shortCode ? (
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-text-parchment/70 text-xs font-[family-name:var(--font-body)] mb-1">
              Your player code (use this to restore on another device)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-text-gold font-mono text-lg tracking-widest">{shortCode}</span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(shortCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-text-parchment/60 hover:text-gold-leaf transition-colors"
                title="Copy code"
              >
                <IoCopyOutline size="1.2em" />
              </button>
              {copied && (
                <span className="text-text-parchment/50 text-xs font-[family-name:var(--font-body)]">
                  Copied!
                </span>
              )}
            </div>
          </div>
        ) : shortCodeError ? (
          <p className="text-red-400 text-xs font-[family-name:var(--font-body)]">{shortCodeError}</p>
        ) : null}

        <div className="border-t border-gold-leaf/20 pt-4 space-y-2">
          <p className="text-text-parchment/70 text-xs font-[family-name:var(--font-body)]">
            Restore from another device
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="XXXX-0000"
              value={restoreCode}
              onChange={(e) => setRestoreCode(e.target.value)}
              className="flex-1 bg-black/30 border border-gold-leaf/40 rounded px-3 py-1.5 text-text-parchment font-mono text-sm focus:outline-none focus:border-gold-leaf"
            />
            <button onClick={() => void handleRestore()} className={btnClass}>
              Restore
            </button>
          </div>
          {restoreError && (
            <p className="text-red-400 text-xs font-[family-name:var(--font-body)]">
              {restoreError}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={closeStats} className={btnClass}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
