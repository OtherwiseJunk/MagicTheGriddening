/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Color, colorPairs } from "@/constants/constraintConstants";
import {
  ConstraintType,
  type GameConstraint,
} from "@/models/UI/gameConstraint";

export default class GriddeningService {
  static getGameConstraintsForIndex(
    gameConstraints: GameConstraint[],
    squareIndex: number
  ): GameConstraint[] {
    const topRow = gameConstraints.slice(0, 3);
    const bottomRow = gameConstraints.slice(3);

    const intersectingConstraints = [
      topRow[squareIndex % 3],
      bottomRow[Math.floor(squareIndex / 3)]
    ];

    return intersectingConstraints;
  }

  static shuffleArray<T>(array: T[]): T[] {
    array = [...array];
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
    const now = this.addDays(new Date(), dayOffset);
    const year = now.getFullYear();
    const month = (now.getMonth()).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  static getArticle = (word: string): string => {
    return ["a", "e", "i", "o", "u"].includes(word.charAt(0).toLowerCase())
      ? "an"
      : "a";
  };

  static doesConstraintRequireWithInText(constraint: GameConstraint): boolean {
    return (
      constraint.constraintType === ConstraintType.Power ||
      constraint.constraintType === ConstraintType.ManaValue ||
      constraint.constraintType === ConstraintType.Toughness
    );
  }

  static buildSetConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);
    if (
      this.doesConstraintRequireWithInText(constraintOne) ||
      this.doesConstraintRequireWithInText(constraintTwo)
    ) {
      return this.doesConstraintRequireWithInText(constraintOne)
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

  private static readonly buildConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint,
    constraintType: ConstraintType,
    format: (constraintOne: GameConstraint, constraintTwo: GameConstraint) => string
  ): string => {
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, constraintType)) {
      return format(constraintOne, constraintTwo);
    }
    return '';
  };

  private static readonly eitherConstraintIsOfType = (one: GameConstraint, two: GameConstraint, type: ConstraintType): boolean => {
    return one.constraintType === type || two.constraintType === type;
  }

  private static readonly buildManaValueConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Power) ||
      this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Toughness)) {
      return constraintOne.constraintType === ConstraintType.Power ||
        constraintOne.constraintType === ConstraintType.Toughness
        ? `Name a card with ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with ${constraintTwo.displayName} with ${constraintOne.displayName} card.`;
    }
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Artist)) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.CreatureRulesText)) {
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

    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Toughness)) {
      return constraintOne.constraintType === ConstraintType.Power
        ? `Name a ${constraintOne.displayName.slice(
          -1
        )}/${constraintTwo.displayName.slice(-1)} card.`
        : `Name a ${constraintTwo.displayName.slice(
          -1
        )}/${constraintOne.displayName.slice(-1)} card.`;
    }
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Artist)) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.CreatureRulesText)) {
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

    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.Artist)) {
      return constraintOne.constraintType === ConstraintType.Artist
        ? `Name a card with art by ${constraintOne.displayName} with ${constraintTwo.displayName}.`
        : `Name a card with art by ${constraintTwo.displayName} with ${constraintOne.displayName}.`;
    }
    if (this.eitherConstraintIsOfType(constraintOne, constraintTwo, ConstraintType.CreatureRulesText)) {
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
    const [artistConstraint, otherConstraint] = constraintOne.constraintType === ConstraintType.Artist
      ? [constraintOne, constraintTwo]
      : [constraintTwo, constraintOne];

    const otherArticle = this.getArticle(otherConstraint.displayName);

    return `Name ${otherArticle} ${otherConstraint.displayName} card with art by ${artistConstraint.displayName}.`;
  };

  private static readonly getRarityConstraintText2 = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const articleOne = this.getArticle(constraintOne.displayName);
    const articleTwo = this.getArticle(constraintTwo.displayName);

    return constraintOne.constraintType === ConstraintType.Rarity
      ? `Name ${articleOne} ${constraintOne.displayName} ${constraintTwo.displayName} card.`
      : `Name ${articleTwo} ${constraintTwo.displayName} ${constraintOne.displayName} card.`;
  };

  private static readonly getRarityConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const [rarityConstraint, otherConstraint] = constraintOne.constraintType === ConstraintType.Rarity
      ? [constraintOne, constraintTwo]
      : [constraintTwo, constraintOne];

    const rarityArticle = this.getArticle(rarityConstraint.displayName);

    return `Name ${rarityArticle} ${rarityConstraint.displayName} ${otherConstraint.displayName} card.`;
  };

  private static readonly getColorConstraintText = (
    constraintOne: GameConstraint,
    constraintTwo: GameConstraint
  ): string => {
    const [colorConstraint, otherConstraint] = constraintOne.constraintType === ConstraintType.Color
      ? [constraintOne, constraintTwo]
      : [constraintTwo, constraintOne];

    const otherArticle = this.getArticle(otherConstraint.displayName);

    return `Name ${otherArticle} ${otherConstraint.displayName} ${colorConstraint.displayName} card.`;
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
    const constraintTextBuilders = [
      { type: ConstraintType.Set, builder: this.buildSetConstraintText },
      { type: ConstraintType.ManaValue, builder: this.buildManaValueConstraintText },
      { type: ConstraintType.Power, builder: this.buildPowerConstraintText },
      { type: ConstraintType.Toughness, builder: this.buildToughnessConstraintText },
      { type: ConstraintType.CreatureRulesText, builder: this.getRulesTextConstraintsText },
      { type: ConstraintType.Artist, builder: this.getArtistConstraintText },
      { type: ConstraintType.Rarity, builder: this.getRarityConstraintText },
    ];

    for (const { type, builder } of constraintTextBuilders) {
      const text = this.buildConstraintText(constraintOne, constraintTwo, type, builder);
      if (text !== '') {
        return text;
      }
    }

    if (constraintOne.constraintType === ConstraintType.Color && constraintTwo.constraintType === ConstraintType.Color) {
      return `Name a ${this.getColorPairText(
        constraintOne.displayName as Color,
        constraintTwo.displayName as Color
      )} card.`;
    }

    return `Name ${this.getArticle(constraintOne.displayName)} ${constraintOne.displayName
      } ${constraintTwo.displayName} card.`;
  };

  static getColorPairText = (colorOne: Color, colorTwo: Color): string => {
    return colorPairs[colorOne][colorTwo];
  };
}
