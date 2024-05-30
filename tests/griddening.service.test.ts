import { expect, describe, it } from "vitest";
/* eslint-disable max-len */
import {
  type GameConstraint,
  ConstraintType,
} from "../src/models/UI/gameConstraint";
import GriddeningService from "../src/services/griddening.service";
import { g } from "vitest/dist/suite-IbNSsUWN.js";

describe("getTextForConstraints", () => {
  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should a string ending in 'from <Set Name>' for a set constraint and a ${constraintOne.displayName} constraint`, () => {
      const constraintTwo: GameConstraint = generateTestConstraint(
        "Aether Revolt",
        ConstraintType.Set
      );

      const expectedEndingText = "from Aether Revolt.";
      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.endsWith(expectedEndingText)).toEqual(true);
    });
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return text containing 'with <displayName>' for a Mana Value constraint and a ${constraintOne.displayName} constraint`, () => {
      const constraintTwo: GameConstraint = generateTestConstraint(
        "Mana Value 2",
        ConstraintType.ManaValue
      );

      const expectedContainingText = "with Mana Value 2";
      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.includes(expectedContainingText)).toEqual(true);
    });
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return text ending with 'with <displayName>' for a Mana Value constraint and a ${constraintOne.displayName} constraint`, () => {
      const constraintTwo: GameConstraint = generateTestConstraint(
        "Mana Value 2",
        ConstraintType.ManaValue
      );

      const expectedContainingText = "with Mana Value 2.";
      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );
      expect(actualText.endsWith(expectedContainingText)).toEqual(true);
    });
  });

  [
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return text starting with 'Name a <rarityconstraint.displayName>' for a rarity constraint and a ${constraintOne.displayName} constraint`, () => {
      const constraintTwo: GameConstraint = generateTestConstraint(
        "Mythic Rare",
        ConstraintType.Rarity
      );

      const expectedStartingText = "Name a Mythic Rare";
      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.startsWith(expectedStartingText)).toBeTruthy();
    });
  });

  [
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return text with <colorConstraint.displayName> for a color constraint and a ${constraintOne.displayName} constraint`, () => {
      const constraintTwo: GameConstraint = generateTestConstraint(
        "Black",
        ConstraintType.Color
      );

      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.includes(constraintTwo.displayName)).toBeTruthy();
    });
  });

  it("should return 'Name a <colorName> <colorName> card.' for a color constraint and a color constraint", () => {
    const constraintOne: GameConstraint = generateTestConstraint(
      "White",
      ConstraintType.Color
    );
    const constraintTwo: GameConstraint = generateTestConstraint(
      "Black",
      ConstraintType.Color
    );

    const expectedText = "Name a White Black card.";
    const actualText = GriddeningService.getTextForConstraints(
      constraintOne,
      constraintTwo
    );

    expect(actualText).toEqual(expectedText);
  });

  it("should return a text of 'Name a <power.displayName>/<toughness.displayName> card' for a power and toughness constraint", () => {
    const power = generateTestConstraint("Power 1", ConstraintType.Power);
    const toughness = generateTestConstraint(
      "Toughness 2",
      ConstraintType.Toughness
    );
    const expectedText = "Name a 1/2 card.";

    expect(GriddeningService.getTextForConstraints(power, toughness)).toEqual(
      expectedText
    );
    expect(GriddeningService.getTextForConstraints(toughness, power)).toEqual(
      expectedText
    );
  });

  [
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing 'with <power.displayName>' for a set constraint with a ${constraintOne.displayName}`, () => {
      const constraintTwo = generateTestConstraint(
        "Power 1",
        ConstraintType.Power
      );
      const expectedText = `with ${constraintTwo.displayName}`;

      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.includes(expectedText)).toBeTruthy();
    });
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text ending with 'with <power.displayName>' for a set constraint with a ${constraintOne.displayName}`, () => {
      const constraintTwo = generateTestConstraint(
        "Power 1",
        ConstraintType.Power
      );
      const expectedText = `with ${constraintTwo.displayName}.`;

      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.endsWith(expectedText)).toBeTruthy();
    });
  });
  [
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing 'with <toughness.displayName>' for a set constraint with a ${constraintOne.displayName}`, () => {
      const constraintTwo = generateTestConstraint(
        "Toughness 1",
        ConstraintType.Toughness
      );
      const expectedText = `with ${constraintTwo.displayName}`;

      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.includes(expectedText)).toBeTruthy();
    });
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text ending with 'with <toughness.displayName>' for a set constraint with a ${constraintOne.displayName}`, () => {
      const constraintTwo = generateTestConstraint(
        "Toughness 1",
        ConstraintType.Toughness
      );
      const expectedText = `with ${constraintTwo.displayName}.`;

      const actualText = GriddeningService.getTextForConstraints(
        constraintOne,
        constraintTwo
      );

      expect(actualText.endsWith(expectedText)).toBeTruthy();
    });
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text ending with 'with rules text '<creatureRulesText.displayName>'' for a creature rules text constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Can't Attack",
        ConstraintType.CreatureRulesText
      );

      const expectedText = `with rules text '${constraintTwo.displayName}'.`;
      const actualText = GriddeningService.getTextForConstraints(constraintOne, constraintTwo);

      console.log(`actualText: ${actualText}`);
      console.log(`expectedText: ${expectedText}`);

      expect(actualText.endsWith(expectedText)).toBeTruthy()
    })
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing <creatureRulesText.displayName> for a creature rules text constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Can't Attack",
        ConstraintType.CreatureRulesText
      );

      expect(GriddeningService.getTextForConstraints(constraintOne, constraintTwo)).toContain(`with rules text '${constraintTwo.displayName}'`);
    })
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing <creatureRace.displayName> for a creature race constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Goblin",
        ConstraintType.CreatureRaceTypes
      );

      expect(GriddeningService.getTextForConstraints(constraintOne, constraintTwo)).toContain(constraintTwo.displayName)
    })
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing <creatureJob.displayName> for a creature job constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Wizard",
        ConstraintType.CreatureJobTypes
      );

      expect(GriddeningService.getTextForConstraints(constraintOne, constraintTwo)).toContain(constraintTwo.displayName)
    })
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint(
      "enchantment subtype",
      ConstraintType.EnchantmentSubtypes
    ),
  ].forEach((constraintOne) => {
    it(`should return a text containing <artifactSubtype.displayName> for a artifact subtype constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Equipment",
        ConstraintType.ArtifactSubtypes
      );

      expect(GriddeningService.getTextForConstraints(constraintOne, constraintTwo)).toContain(constraintTwo.displayName)
    })
  });

  [
    generateTestConstraint("rarity", ConstraintType.Rarity),
    generateTestConstraint("type", ConstraintType.Type),
    generateTestConstraint("color", ConstraintType.Color),
    generateTestConstraint("mana value", ConstraintType.ManaValue),
    generateTestConstraint("set", ConstraintType.Set),
    generateTestConstraint("power", ConstraintType.Power),
    generateTestConstraint("toughness", ConstraintType.Toughness),
    generateTestConstraint("artist", ConstraintType.Artist),
    generateTestConstraint(
      "creature rules text",
      ConstraintType.CreatureRulesText
    ),
    generateTestConstraint("creature race", ConstraintType.CreatureRaceTypes),
    generateTestConstraint("creature job", ConstraintType.CreatureJobTypes),
    generateTestConstraint("artifact subtype", ConstraintType.ArtifactSubtypes),
  ].forEach((constraintOne) => {
    it(`should return a text containing <enchantmentSubtype.displayName> for a enchantment subtype constraint with a ${constraintOne.displayName} constraint.`, () => {
      const constraintTwo = generateTestConstraint(
        "Aura",
        ConstraintType.EnchantmentSubtypes
      );

      expect(GriddeningService.getTextForConstraints(constraintOne, constraintTwo)).toContain(constraintTwo.displayName)
    })
  });
});

describe("getGameConstraintsForIndex", () => {
  const gameConstraints: GameConstraint[] = [
    generateTestConstraint('name1', ConstraintType.Artist),
    generateTestConstraint('name2', ConstraintType.Color),
    generateTestConstraint('name3', ConstraintType.CreatureJobTypes),
    generateTestConstraint('name4', ConstraintType.CreatureRaceTypes),
    generateTestConstraint('name5', ConstraintType.CreatureRulesText),
    generateTestConstraint('name6', ConstraintType.Power),
    generateTestConstraint('name7', ConstraintType.Toughness),
    generateTestConstraint('name8', ConstraintType.Rarity),
    generateTestConstraint('name9', ConstraintType.EnchantmentSubtypes),
  ];

  it('should return correct constraints for each square index', () => {
    const expectedResults = [
      [gameConstraints[0], gameConstraints[3]],
      [gameConstraints[1], gameConstraints[3]],
      [gameConstraints[2], gameConstraints[3]],
      [gameConstraints[0], gameConstraints[4]],
      [gameConstraints[1], gameConstraints[4]],
      [gameConstraints[2], gameConstraints[4]],
      [gameConstraints[0], gameConstraints[5]],
      [gameConstraints[1], gameConstraints[5]],
      [gameConstraints[2], gameConstraints[5]],
    ];

    for (let i = 0; i < 9; i++) {
      let result = GriddeningService.getGameConstraintsForIndex(gameConstraints, i);
      expect(result).toEqual(expectedResults[i]);
    }
  });
});

describe("getTodaysDateString", () => {
  it('should return today\'s date string with no offset', () => {
    const result = GriddeningService.getTodaysDateString();
    const now = new Date();
    const expected = `${now.getFullYear()}${(now.getMonth()).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
    expect(result).toBe(expected);
  });

  it('should return tomorrow\'s date string with an offset of 1', () => {
    const result = GriddeningService.getTodaysDateString(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = `${tomorrow.getFullYear()}${(tomorrow.getMonth()).toString().padStart(2, "0")}${tomorrow.getDate().toString().padStart(2, "0")}`;
    expect(result).toBe(expected);
  });

  it('should return yesterday\'s date string with an offset of -1', () => {
    const result = GriddeningService.getTodaysDateString(-1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = `${yesterday.getFullYear()}${(yesterday.getMonth()).toString().padStart(2, "0")}${yesterday.getDate().toString().padStart(2, "0")}`;
    expect(result).toBe(expected);
  });
});

describe('buildSetConstraintText', () => {
  const testCases = [
    {
      constraintOne: generateTestConstraint('Power 4', ConstraintType.Power),
      constraintTwo: generateTestConstraint('Set XYZ', ConstraintType.Set),
      expected: 'Name a card with Power 4 from Set XYZ.'
    },
    {
      constraintOne: generateTestConstraint('ManaValue 5', ConstraintType.ManaValue),
      constraintTwo: generateTestConstraint('Set XYZ', ConstraintType.Set),
      expected: 'Name a card with ManaValue 5 from Set XYZ.'
    },
    {
      constraintOne: generateTestConstraint('Toughness 6', ConstraintType.Toughness),
      constraintTwo: generateTestConstraint('Set XYZ', ConstraintType.Set),
      expected: 'Name a card with Toughness 6 from Set XYZ.'
    },
    {
      constraintOne: generateTestConstraint('Artist ABC', ConstraintType.Artist),
      constraintTwo: generateTestConstraint('Set XYZ', ConstraintType.Set),
      expected: 'Name a card with art by Artist ABC from Set XYZ.'
    },
    {
      constraintOne: generateTestConstraint('Creature Rules Text DEF', ConstraintType.CreatureRulesText),
      constraintTwo: generateTestConstraint('Set XYZ', ConstraintType.Set),
      expected: "Name a card with rules text 'Creature Rules Text DEF' from Set XYZ."
    },
    {
      constraintOne: generateTestConstraint('Set XYZ', ConstraintType.Set),
      constraintTwo: generateTestConstraint('Power 4', ConstraintType.Power),
      expected: 'Name a card with Power 4 from Set XYZ.'
    }
  ];

  testCases.forEach(({ constraintOne, constraintTwo, expected }) => {
    it(`should return "${expected}" for constraints "${constraintOne.displayName}" and "${constraintTwo.displayName}"`, () => {
      const result = GriddeningService.buildSetConstraintText(constraintOne, constraintTwo);
      expect(result).toBe(expected);
    });
  });
});

describe('GriddeningService', () => {
  describe('getColorPairText', () => {
    const testCases = [
      { colorOne: 'White', colorTwo: 'Blue', expected: 'White Blue' },
      { colorOne: 'White', colorTwo: 'Black', expected: 'White Black' },
      { colorOne: 'White', colorTwo: 'Red', expected: 'Red White' },
      { colorOne: 'White', colorTwo: 'Green', expected: 'White Green' },
      { colorOne: 'Blue', colorTwo: 'White', expected: 'White Blue' },
      { colorOne: 'Blue', colorTwo: 'Black', expected: 'Blue Black' },
      { colorOne: 'Blue', colorTwo: 'Red', expected: 'Blue Red' },
      { colorOne: 'Blue', colorTwo: 'Green', expected: 'Blue Green' },
      { colorOne: 'Black', colorTwo: 'White', expected: 'White Black' },
      { colorOne: 'Black', colorTwo: 'Blue', expected: 'Blue Black' },
      { colorOne: 'Black', colorTwo: 'Red', expected: 'Black Red' },
      { colorOne: 'Black', colorTwo: 'Green', expected: 'Black Green' },
      { colorOne: 'Red', colorTwo: 'White', expected: 'Red White' },
      { colorOne: 'Red', colorTwo: 'Blue', expected: 'Blue Red' },
      { colorOne: 'Red', colorTwo: 'Black', expected: 'Black Red' },
      { colorOne: 'Red', colorTwo: 'Green', expected: 'Red Green' },
      { colorOne: 'Green', colorTwo: 'White', expected: 'White Green' },
      { colorOne: 'Green', colorTwo: 'Blue', expected: 'Blue Green' },
      { colorOne: 'Green', colorTwo: 'Black', expected: 'Black Green' },
      { colorOne: 'Green', colorTwo: 'Red', expected: 'Red Green' },
    ];

    testCases.forEach(({ colorOne, colorTwo, expected }) => {
      it(`should return ${expected} for ${colorOne} and ${colorTwo}`, () => {
        const actual = GriddeningService.getColorPairText(colorOne, colorTwo);
        expect(actual).toBe(expected);
      });
    });
  });
});

function generateTestConstraint(
  name: string,
  type: ConstraintType
): GameConstraint {
  return {
    displayName: name,
    constraintType: type,
    scryfallQuery: "",
    imageSrc: "",
    imageAltText: "",
  };
}
