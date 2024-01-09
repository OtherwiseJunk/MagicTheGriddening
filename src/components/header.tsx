"use client";

import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Image from "next/image";
import { PiButterfly } from "react-icons/pi";
import { IconContext } from "react-icons";

function ResponsiveAppBar(): React.JSX.Element {
  return (
    <AppBar
      className="paper-texture"
      position="static"
      sx={{ bgcolor: "rgb(66 32 6)", mb: "40px" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Image
            className="mr-4"
            src="/magic-the-griddening.png"
            alt="logo"
            height={32}
            width={32}
          ></Image>
          <p className="text-3xl flex-1">Magic: The Griddening</p>
          <div
            className="float-right flex flex-col items-center"
            title="Follow us on Bluesky!"
          >
            <IconContext.Provider value={{ size: "2em" }}>
              <a
                href="https://bsky.app/profile/magicthegridden.ing"
                target="_blank"
                rel="noreferrer"
              >
                <PiButterfly />
                <p>Bsky</p>
              </a>
            </IconContext.Provider>
          </div>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
