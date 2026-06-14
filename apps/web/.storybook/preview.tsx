import type { Preview, Decorator } from "@storybook/react";
import React from "react";
import "../src/app/globals.css";
import { PlayerContext, type PlayerContextValue } from "../src/contexts/playerContext";

const defaultPlayer: PlayerContextValue = {
  userId: "mock-uuid-1234",
  shortCode: "ABCD-1234",
  shortCodeError: null,
  statsOpen: false,
  openStats: () => {},
  closeStats: () => {},
  restorePlayer: () => {},
};

const withPlayer: Decorator = (Story, ctx) => (
  <PlayerContext.Provider value={{ ...defaultPlayer, ...(ctx.parameters.player as Partial<PlayerContextValue> | undefined) }}>
    <Story />
  </PlayerContext.Provider>
);

const preview: Preview = {
  decorators: [withPlayer],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    nextjs: { appDirectory: true },
  },
};

export default preview;
