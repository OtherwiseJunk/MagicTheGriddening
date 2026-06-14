"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const COOKIE_KEY = "griddening.userId";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const SESSION_ERRORS = {
  init: "Couldn't load your player code. Try refreshing.",
  restore: "Profile restored, but couldn't load your player code. Open stats to try again.",
} as const;

function readUserIdFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)griddening\.userId=([^;]+)/);
  return match ? match[1] : null;
}

function persistUserId(uuid: string): void {
  localStorage.setItem(COOKIE_KEY, uuid);
  document.cookie = `${COOKIE_KEY}=${uuid};max-age=${COOKIE_MAX_AGE};path=/;SameSite=Lax`;
}

interface PlayerContextValue {
  userId: string;
  shortCode: string | null;
  shortCodeError: string | null;
  statsOpen: boolean;
  openStats: () => void;
  closeStats: () => void;
  restorePlayer: (newId: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [userId, setUserId] = useState<string>("");
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [shortCodeError, setShortCodeError] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState<boolean>(false);

  async function initPlayer(uuid: string, context: keyof typeof SESSION_ERRORS): Promise<void> {
    persistUserId(uuid);
    setUserId(uuid);
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: uuid }),
      });
      const data = (await r.json()) as { shortCode: string };
      setShortCode(data.shortCode);
      setShortCodeError(null);
    } catch {
      setShortCodeError(SESSION_ERRORS[context]);
    }
  }

  useEffect(() => {
    const uuid =
      readUserIdFromCookie() ?? localStorage.getItem(COOKIE_KEY) ?? crypto.randomUUID();
    void initPlayer(uuid, "init");
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        userId,
        shortCode,
        shortCodeError,
        statsOpen,
        openStats: () => setStatsOpen(true),
        closeStats: () => setStatsOpen(false),
        restorePlayer: (newId) => void initPlayer(newId, "restore"),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
