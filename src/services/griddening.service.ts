/* eslint-disable @typescript-eslint/no-extraneous-class */
import {
  ConstraintType,
  type GameConstraint,
} from "@/models/UI/gameConstraint";
import { Game } from "@prisma/client";
import build from "next/dist/build";

export default class GriddeningService {
  static getGameConstraintsForIndex(
    gameConstraints: GameConstraint[],
    squareIndex: number
  ): GameConstraint[] {
    let intersectingConstraints: GameConstraint[] = [];
    const topRow = gameConstraints.slice(0, 3);
    const bottomRow = gameConstraints.slice(3);

    switch (squareIndex) {
      case 0:
        intersectingConstraints = [topRow[0], bottomRow[0]];
        break;
      case 1:
        intersectingConstraints = [topRow[1], bottomRow[0]];
        break;
      case 2:
        intersectingConstraints = [topRow[2], bottomRow[0]];
        break;
      case 3:
        intersectingConstraints = [topRow[0], bottomRow[1]];
        break;
      case 4:
        intersectingConstraints = [topRow[1], bottomRow[1]];
        break;
      case 5:
        intersectingConstraints = [topRow[2], bottomRow[1]];
        break;
      case 6:
        intersectingConstraints = [topRow[0], bottomRow[2]];
        break;
      case 7:
        intersectingConstraints = [topRow[1], bottomRow[2]];
        break;
      case 8:
        intersectingConstraints = [topRow[2], bottomRow[2]];
        break;
    }

    return intersectingConstraints;
  }

  static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  static addDays(dateToAddTo: Date, days: number): Date {
    const date = new Date(dateToAddTo.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }

  static getTodaysDateString(dayOffset: number = 0): string {
    let now = new Date();
    now = this.addDays(now, dayOffset);
    return `${now.getFullYear()}${now
      .getMonth()
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  }

  static getArticle = (word: string): string => {
    return ["a", "e", "i", "o", "u"].includes(word.charAt(0).toLowerCase())
      ? "an"
      : "a";
  };

  static isConstraintRequiringWithText(constraint: GameConstraint): boolean {
    return (
      constraint.constraintType === ConstraintType.Power ||
      constraint.constraintType === ConstraintType.ManaValue ||
      constraint.constraintType === ConstraintType.Toughness
    );
  }

  private static readonly buildSetConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);
    if (
      this.isConstraintRequiringWithText(constraintOne) ||
      this.isConstraintRequiringWithText(constraintTwo)
    ) {
      return this.isConstraintRequiringWithText(constraintOne)
        ? `Name a card with ${constraintOne.displayName} from ${constraintTwo.displayName}.`
        : `Name a card with ${constraintTwo.displayName} from ${constraintOne.displayName}.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.Artist ||
      constraintTwo.constraintType === ConstraintType.Artist
    ) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} from ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} from ${constraintOne.displayName}.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.CreatureRulesText ||
      constraintTwo.constraintType === ConstraintType.CreatureRulesText
    ) {
      return constraintOne.constraintType === ConstraintType.CreatureRulesText
        ? `Name a card with rules text '${constraintOne.displayName}' from ${constraintTwo.displayName}.`
        : `Name a card with rules text '${constraintTwo.displayName}' from ${constraintOne.displayName}.`;
    }
    return constraintOne.constraintType === ConstraintType.Set
      ? `Name ${articleTwo} ${constraintTwo.displayName} card from ${constraintOne.displayName}.`
      : `Name ${articleOne} ${constraintOne.displayName} card from ${constraintTwo.displayName}.`;
  };

  private static readonly buildManaValueConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    if (
      constraintOne.constraintType === ConstraintType.Power ||
      constraintTwo.constraintType === ConstraintType.Power ||
      constraintOne.constraintType === ConstraintType.Toughness ||
      constraintTwo.constraintType === ConstraintType.Toughness
    ) {
      return constraintOne.constraintType === ConstraintType.Power ||
        constraintOne.constraintType === ConstraintType.Toughness
        ? `Name a card with ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with ${constraintTwo.displayName} with${constraintOne.displayName} card.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.Artist ||
      constraintTwo.constraintType === ConstraintType.Artist
    ) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.CreatureRulesText ||
      constraintTwo.constraintType === ConstraintType.CreatureRulesText
    ) {
      return constraintOne.constraintType === ConstraintType.CreatureRulesText
        ? `Name a card with rules text '${constraintOne.displayName}' with ${constraintTwo.displayName}.`
        : `Name a card with rules text '${constraintTwo.displayName}' with ${constraintOne.displayName}.`;
    }
    return constraintOne.constraintType === ConstraintType.ManaValue
      ? `Name ${articleTwo} ${constraintTwo.displayName} card with ${constraintOne.displayName}.`
      : `Name ${articleOne} ${constraintOne.displayName} card with ${constraintTwo.displayName}.`;
  };

  private static readonly buildPowerConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    if (
      constraintOne.constraintType === ConstraintType.Toughness ||
      constraintTwo.constraintType === ConstraintType.Toughness
    ) {
      return constraintOne.constraintType === ConstraintType.Power
        ? `Name a ${constraintOne.displayName.slice(
            -1
          )}/${constraintTwo.displayName.slice(-1)} card.`
        : `Name a ${constraintTwo.displayName.slice(
            -1
          )}/${constraintOne.displayName.slice(-1)} card.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.Artist ||
      constraintTwo.constraintType === ConstraintType.Artist
    ) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.CreatureRulesText ||
      constraintTwo.constraintType === ConstraintType.CreatureRulesText
    ) {
      return constraintOne.constraintType === ConstraintType.CreatureRulesText
        ? `Name a card with rules text '${constraintOne.displayName}' with ${constraintTwo.displayName}.`
        : `Name a card with rules text '${constraintTwo.displayName}' with ${constraintOne.displayName}.`;
    }
    return constraintOne.constraintType === ConstraintType.Power
      ? `Name ${articleTwo} ${constraintTwo.displayName} card with ${constraintOne.displayName}.`
      : `Name ${articleOne} ${constraintOne.displayName} card with ${constraintTwo.displayName}.`;
  };

  private static readonly buildToughnessConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    if (
      constraintOne.constraintType === ConstraintType.Artist ||
      constraintTwo.constraintType === ConstraintType.Artist
    ) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (
      constraintOne.constraintType === ConstraintType.CreatureRulesText ||
      constraintTwo.constraintType === ConstraintType.CreatureRulesText
    ) {
      return constraintOne.constraintType === ConstraintType.CreatureRulesText
        ? `Name a card with rules text '${constraintOne.displayName}' with ${constraintTwo.displayName}.`
        : `Name a card with rules text '${constraintTwo.displayName}' with ${constraintOne.displayName}.`;
    }
    return constraintOne.constraintType === ConstraintType.Toughness
      ? `Name ${articleTwo} ${constraintTwo.displayName} card with ${constraintOne.displayName}.`
      : `Name ${articleOne} ${constraintOne.displayName} card with ${constraintTwo.displayName}.`;
  };

  private static readonly getArtistConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    return constraintOne.constraintType === ConstraintType.Artist
      ? `Name ${articleTwo} ${constraintTwo.displayName} card with art by ${constraintOne.displayName}.`
      : `Name ${articleOne} ${constraintOne.displayName} card with art by ${constraintTwo.displayName}.`;
  };

  private static readonly getRarityConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    return constraintOne.constraintType === ConstraintType.Rarity
      ? `Name ${articleOne} ${constraintOne.displayName} ${constraintTwo.displayName} card.`
      : `Name ${articleTwo} ${constraintTwo.displayName} ${constraintOne.displayName} card.`;
  };

  private static readonly getColorConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    return constraintOne.constraintType === ConstraintType.Color
      ? `Name ${articleOne} ${constraintOne.displayName} ${constraintTwo.displayName} card.`
      : `Name ${articleTwo} ${constraintTwo.displayName} ${constraintOne.displayName} card.`;
  };

  private static readonly getRulesTextConstraintsText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    if (
      constraintOne.constraintType === ConstraintType.Artist ||
      constraintTwo.constraintType === ConstraintType.Artist
    ) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with rules text '${constraintTwo.displayName}'.`
        : `Name a card with art by ${constraintTwo.displayName} with rules text '${constraintOne.displayName}'.`;
    }

    return constraintOne.constraintType === ConstraintType.CreatureRulesText 
      ? `Name ${articleTwo} ${constraintTwo.displayName} card with rules text '${constraintOne.displayName}'.`
      : `Name ${articleOne} ${constraintOne.displayName} card with rules text '${constraintTwo.displayName}'.`
  }

  static getTextForConstraints = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    switch (true) {
      case constraintOne.constraintType === ConstraintType.Set ||
        constraintTwo.constraintType === ConstraintType.Set:
        return this.buildSetConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.ManaValue ||
        constraintTwo.constraintType === ConstraintType.ManaValue:
        return this.buildManaValueConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.Power ||
        constraintTwo.constraintType === ConstraintType.Power:
        return this.buildPowerConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.Toughness ||
        constraintTwo.constraintType === ConstraintType.Toughness:
        return this.buildToughnessConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.CreatureRulesText ||
        constraintTwo.constraintType === ConstraintType.CreatureRulesText:
        return this.getRulesTextConstraintsText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.Artist ||
        constraintTwo.constraintType === ConstraintType.Artist:
        return this.getArtistConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.Rarity ||
        constraintTwo.constraintType === ConstraintType.Rarity:
        return this.getRarityConstraintText(constraintOne, constraintTwo);

      case constraintOne.constraintType === ConstraintType.Color &&
        constraintTwo.constraintType === ConstraintType.Color:
        return `Name a ${this.getColorPairText(
          constraintOne.displayName,
          constraintTwo.displayName
        )} card.`;

      case constraintOne.constraintType === ConstraintType.Color ||
        constraintTwo.constraintType === ConstraintType.Color:
        return this.getColorConstraintText(constraintOne, constraintTwo);

      default:
        return `Name ${this.getArticle(constraintOne.displayName)} ${
          constraintOne.displayName
        } ${constraintTwo.displayName} card.`;
    }
  };

  static getColorPairText = (colorOne: string, colorTwo: string): string => {
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
}
