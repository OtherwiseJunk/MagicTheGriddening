import type { Meta, StoryObj, Decorator } from "@storybook/react";
import React, { useEffect } from "react";
import StatsDialog from "./statsDialog";

const mockStats = {
  gamesPlayed: 42,
  gamesCompleted: 28,
  currentStreak: 5,
  bestStreak: 12,
  scoreDistribution: [2, 3, 4, 5, 6, 7, 8, 4, 2, 1],
};

const withStatsFetch: Decorator = (Story) => {
  const originalRef = React.useRef(globalThis.fetch);
  globalThis.fetch = async (url) => {
    if (String(url).includes("/api/stats/")) {
      return new Response(JSON.stringify(mockStats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalRef.current(url as Parameters<typeof fetch>[0]);
  };
  useEffect(
    () => () => {
      globalThis.fetch = originalRef.current;
    },
    [],
  );
  return <Story />;
};

const meta: Meta<typeof StatsDialog> = {
  component: StatsDialog,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof StatsDialog>;

export const Closed: Story = {};

export const Open: Story = {
  decorators: [withStatsFetch],
  parameters: {
    player: { statsOpen: true },
  },
};

export const OpenNoShortCode: Story = {
  decorators: [withStatsFetch],
  parameters: {
    player: { statsOpen: true, shortCode: null },
  },
};

export const OpenWithError: Story = {
  decorators: [withStatsFetch],
  parameters: {
    player: {
      statsOpen: true,
      shortCode: null,
      shortCodeError:
        "Profile restored, but couldn't load your player code. Open stats to try again.",
    },
  },
};
