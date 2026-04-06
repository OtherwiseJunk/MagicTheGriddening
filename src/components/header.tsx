"use client";

import React from "react";
import Image from "next/image";
import { PiButterfly } from "react-icons/pi";
import { IconContext } from "react-icons";
import RulesDialog from "./rulesDialog";

function Header(): React.JSX.Element {
  return (
    <nav className="paper-texture bg-parchment-brown border-b-2 border-gold-leaf shadow-header-bar mb-10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center">
        <Image className="mr-4" src="/magic-the-griddening.png" alt="logo" height={36} width={36} />
        <h1
          className="text-2xl md:text-3xl flex-1 text-text-parchment"
          style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.6), 0 0 8px rgba(201, 168, 76, 0.2)" }}
        >
          Magic: The Griddening
        </h1>
        <RulesDialog />
        <div
          className="flex flex-col items-center text-text-parchment/80 hover:text-gold-leaf transition-colors"
          title="Follow us on Bluesky!"
        >
          <IconContext.Provider value={{ size: "2em" }}>
            <a href="https://bsky.app/profile/magicthegridden.ing" target="_blank" rel="noreferrer">
              <PiButterfly />
              <p className="text-xs font-[family-name:var(--font-body)]">Bsky</p>
            </a>
          </IconContext.Provider>
        </div>
      </div>
    </nav>
  );
}
export default Header;
