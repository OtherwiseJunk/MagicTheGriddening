import {
  type GameConstraint,
  ConstraintType,
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

const getColorPairText = (colorOne: string, colorTwo: string): string => {
  if (colorOne === "White") {
    switch (colorTwo) {
      case "Blue":
        return "White Blue";
      case "Black":
        return "White Black";
      case "Red":
        return "Red White";
      case "Green":
        return "White Green";
    }
  }
  if (colorOne === "Blue") {
    switch (colorTwo) {
      case "Black":
        return "Blue Black";
      case "Red":
        return "Blue Red";
      case "Green":
        return "Blue Green";
      case "White":
        return "White Blue";
    }
  }
  if (colorOne === "Black") {
    switch (colorTwo) {
      case "Red":
        return "Black Red";
      case "Green":
        return "Black Green";
      case "White":
        return "White Black";
      case "Blue":
        return "Blue Black";
    }
  }
  if (colorOne === "Red") {
    switch (colorTwo) {
      case "Green":
        return "Red Green";
      case "White":
        return "Red White";
      case "Blue":
        return "Blue Red";
      case "Black":
        return "Black Red";
    }
  }
  if (colorOne === "Green") {
    switch (colorTwo) {
      case "White":
        return "White Green";
      case "Blue":
        return "Blue Green";
      case "Black":
        return "Black Green";
      case "Red":
        return "Red Green";
    }
  }

  return "";
};

const getTextForConstraints = (
  constraintOne: GameConstraint,
  constraintTwo: GameConstraint
): string => {
  const artcileOne = constraintOne.displayName.startsWith("U") ? "an" : "a";
  const artcileTwo = constraintTwo.displayName.startsWith("U") ? "an" : "a";
  const typeOne = constraintOne.constraintType;
  const typeTwo = constraintTwo.constraintType;
  if (typeOne === ConstraintType.Set || typeTwo === ConstraintType.Set) {
    if (
      typeTwo === ConstraintType.ManaValue ||
      typeOne === ConstraintType.ManaValue
    ) {
      return typeOne === ConstraintType.ManaValue
        ? `Name a card with ${constraintOne.displayName} from ${constraintTwo.displayName}.`
        : `Name a card with ${constraintTwo.displayName} from ${constraintOne.displayName}.`;
    }
    return typeOne === ConstraintType.Set
      ? `Name ${artcileTwo} ${constraintTwo.displayName} card from ${constraintOne.displayName}.`
      : `Name ${artcileOne} ${constraintOne.displayName} card from ${constraintTwo.displayName}.`;
  }
  if (
    typeOne === ConstraintType.ManaValue ||
    typeTwo === ConstraintType.ManaValue
  ) {
    return typeOne === ConstraintType.ManaValue
      ? `Name ${artcileTwo} ${constraintTwo.displayName} card with ${constraintOne.displayName}.`
      : `Name ${artcileOne} ${constraintOne.displayName} card with ${constraintTwo.displayName}.`;
  }
  if (typeOne === ConstraintType.Rarity || typeTwo === ConstraintType.Rarity) {
    return typeOne === ConstraintType.Rarity
      ? `Name ${artcileOne} ${constraintOne.displayName} ${constraintTwo.displayName} card.`
      : `Name ${artcileTwo} ${constraintTwo.displayName} ${constraintOne.displayName} card.`;
  }
  if (typeOne === ConstraintType.Color && typeTwo === ConstraintType.Color) {
    return `Name a ${getColorPairText(
      constraintOne.displayName,
      constraintTwo.displayName
    )} card.`;
  }
  if (typeOne === ConstraintType.Color || typeTwo === ConstraintType.Color) {
    return typeOne === ConstraintType.Color
      ? `Name a ${constraintOne.displayName} ${constraintTwo.displayName} card.`
      : `Name a ${constraintTwo.displayName} ${constraintOne.displayName} card.`;
  }
  return `Name ${artcileOne} ${constraintOne.displayName} ${constraintTwo.displayName} card.`;
};

const getConstraintsText = (
  constraints: GameConstraint[],
  squareIndex: number
): string => {
  const [constraintOne, constraintTwo] =
    GriddeningService.getGameConstraintsForIndex(constraints, squareIndex);
  return constraintOne !== undefined
    ? getTextForConstraints(constraintOne, constraintTwo)
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
        <div className="paper-texture p-5 bg-amber-700 dialog-border">
          <InputLabel className="p-5">
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
              "@media (min-width: 500px)": {
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
