import Footer from "@/components/footer";
import Game from "@/components/game";
import Header from "@/components/header";
import StatsDialog from "@/components/statsDialog";
import { PlayerProvider } from "@/contexts/playerContext";
import React from "react";

export default function Home(): React.JSX.Element {
  return (
    <PlayerProvider>
      <Header />
      <StatsDialog />
      <Game />
      <Footer />
    </PlayerProvider>
  );
}
