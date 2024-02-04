import {
  type GameConstraint,
} from "@/models/UI/gameConstraint";
import { type GameState } from "@/models/UI/gameState";
import ScryfallService from "@/services/scryfall.service";
import GriddeningService from "@/services/griddening.service";
import { ThemeProvider } from "@emotion/react";
import {
  Dialog,
  InputLabel,
  Autocomplete,
  TextField,
  Button,
  createTheme,
} from "@mui/material";
import { Eczar } from "next/font/google";
import React, { useEffect, useState } from "react";
import { type Card } from "scryfall-sdk";

const dialogFont = Eczar({ subsets: ["latin"] });

const getConstraintsText = (
  constraints: GameConstraint[],
  squareIndex: number
): string => {
  const [constraintOne, constraintTwo] =
    GriddeningService.getGameConstraintsForIndex(constraints, squareIndex);
  return constraintOne !== undefined
    ? GriddeningService.getTextForConstraints(constraintOne, constraintTwo)
    : "";
};

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const submitAnswer = async (
  playerId: string,
  squareIndex: number,
  guess: string
): Promise<boolean> => {
  const response = await fetch("/api/submitAnswer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      squareIndex,
      guess,
    }),
  });

  return response.status === 200;
};

interface InputProps {
  gameState: GameState;
  setGameState: (gameState: GameState) => void;
  dialogGridIndex: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function InputDialog(props: InputProps): React.JSX.Element {
  const [cardOptions, setCardOptions] = useState([] as string[]);
  const [currentValue, setCurrentValue] = useState("");
  const handleClose = (): void => {
    props.setIsOpen(false);
  };

  const updateCardOptions = async (newValue: string | null): Promise<void> => {
    setCurrentValue(newValue ?? "");

    if (newValue !== null && newValue.length >= 3) {
      await ScryfallService.getCards(newValue).then((foundCards: Card[]) => {
        setCardOptions(
          foundCards
            .map((card) => card.name)
            .filter((cardName) =>
              cardName.toLowerCase().includes(newValue.toLowerCase())
            )
        );
      });
    }
  };

  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let storedUserId: string | null = localStorage.getItem("griddening.userId");
    if (storedUserId == null) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem("griddening.userId", storedUserId);
    }

    setUserId(storedUserId);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Dialog
        className={dialogFont.className}
        open={props.isOpen}
        onClose={() => {
          handleClose();
          setCardOptions([]);
        }}
      >
        <div className="paper-texture  p-5 text-[12px] lg:text-xl bg-amber-700 dialog-border bordered">
          <InputLabel className="p-5 input-label">
            {getConstraintsText(
              props.gameState.gameConstraints,
              props.dialogGridIndex
            )}
          </InputLabel>
          <Autocomplete
            onInputChange={(_, newValue) => {
              void updateCardOptions(newValue);
            }}
            id="card-search"
            options={cardOptions}
            sx={{
              width: 200,
              margin: 2,
              "@media (min-width: 451px)": {
                width: 500,
              },
            }}
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField {...params} label="Card Search..." />
            )}
          />
          <Button
            className="blue-background my-3 p-2 float-right"
            variant="outlined"
            onClick={() => {
              if (currentValue.length > 0) {
                void submitAnswer(
                  userId,
                  props.dialogGridIndex,
                  currentValue
                ).then(() => {
                  setCardOptions([]);
                  handleClose();
                  props.setGameState({
                    ...props.gameState,
                    lifePoints: props.gameState.lifePoints - 1,
                  });
                });
              }
            }}
          >
            Submit
          </Button>
        </div>
      </Dialog>
    </ThemeProvider>
  );
}
