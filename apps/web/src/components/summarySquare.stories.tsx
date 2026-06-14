import type { Meta, StoryObj, Decorator } from "@storybook/react";
import React, { useEffect } from "react";
import SummarySquare from "./summarySquare";
import { CorrectGuess } from "@/models/UI/correctGuess";

const PLACEHOLDER_IMAGE = "https://cards.scryfall.io/png/front/e/9/e9d5aee0.png";

const someGuesses = [
  new CorrectGuess("Lightning Bolt", PLACEHOLDER_IMAGE, 0),
  new CorrectGuess("Counterspell", PLACEHOLDER_IMAGE, 2),
  new CorrectGuess("Dark Ritual", PLACEHOLDER_IMAGE, 4),
  new CorrectGuess("Giant Growth", PLACEHOLDER_IMAGE, 6),
];

const allGuesses = Array.from({ length: 9 }, (_, i) =>
  new CorrectGuess("Lightning Bolt", PLACEHOLDER_IMAGE, i),
);

const mockAnalytics = Array.from({ length: 9 }, () => ({
  available: true,
  totalPlayers: 100,
  picks: [
    { card: "Lightning Bolt", count: 42 },
    { card: "Shock", count: 18 },
  ],
}));

const withAnalyticsFetch: Decorator = (Story) => {
  const originalRef = React.useRef(globalThis.fetch);
  globalThis.fetch = async (url) => {
    if (String(url).includes("/api/stats/global/")) {
      const parts = String(url).split("/");
      const squareIndex = parseInt(parts[parts.length - 1]);
      return new Response(JSON.stringify(mockAnalytics[squareIndex] ?? { available: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalRef.current(url as Parameters<typeof fetch>[0]);
  };
  useEffect(() => () => { globalThis.fetch = originalRef.current; }, []);
  return <Story />;
};

const meta: Meta<typeof SummarySquare> = {
  component: SummarySquare,
  parameters: { layout: "centered" },
  args: { hidden: false, correctGuesses: [], gameId: undefined },
};
export default meta;

type Story = StoryObj<typeof SummarySquare>;

export const Hidden: Story = {
  args: { hidden: true },
};

export const GameOver: Story = {
  args: { correctGuesses: someGuesses },
};

export const Archmage: Story = {
  args: { correctGuesses: allGuesses },
};

export const WithAnalytics: Story = {
  decorators: [withAnalyticsFetch],
  args: { correctGuesses: someGuesses, gameId: 1 },
};

export const ArchmageWithAnalytics: Story = {
  decorators: [withAnalyticsFetch],
  args: { correctGuesses: allGuesses, gameId: 1 },
};
