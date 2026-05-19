import { GameConstraint, ConstraintType } from "../../../types/GameConstraint";
import { ScryfallHelper } from "../scryfall.helper";
import * as Scry from "scryfall-sdk";

const vintageSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  "1993-01-01",
  "Vintage",
  "V",
);
const modernSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2003-01-01",
  "Modern",
  "M",
);
export const pioneerSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2013-01-01",
  "Pioneer",
  "P",
);
export const standardSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2021-01-01",
  "Standard",
  "S",
);
export const noReleaseAtSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  undefined,
  "No Release",
  "NR",
);
export const firstPioneerSet: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2012-10-05",
  "Ravnica I think",
  "RTR",
);
export const dayAfterFirstPioneerSet: Scry.Set =
  ScryfallHelper.generateScryfallSet("2012-10-04", "not a set", "nas");
export const dayBeforeFirstPioneerSet: Scry.Set =
  ScryfallHelper.generateScryfallSet("2012-10-06", "not a set", "nas");
export const dayBefore2013Set: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2012-12-31",
  "not a set",
  "nas",
);
export const firstDayOf2013Set: Scry.Set = ScryfallHelper.generateScryfallSet(
  "2013-01-01",
  "not a set",
  "nas",
);
export const setTypesToFilter = [
  "masters",
  "alchemy",
  "masterpiece",
  "arsenal",
  "from_the_vault",
  "spellbook",
  "premium_deck",
  "duel_deck",
  "draft_innovation",
  "treasure_chest",
  "commander",
  "planeschase",
  "archenemy",
  "vanguard",
  "funny",
  "starter",
  "box",
  "promo",
  "token",
  "memorabilia",
  "minigame",
];

export const setsWithExpectedIsPioneerReturns = [
  [vintageSet, false],
  [modernSet, false],
  [noReleaseAtSet, false],
  [dayAfterFirstPioneerSet, false],
  [dayBeforeFirstPioneerSet, false],
  [dayBefore2013Set, false],
  [firstDayOf2013Set, true],
  [firstPioneerSet, true],
  [pioneerSet, true],
  [standardSet, true],
];

export const setsWithExpectedConstraintReturns = [
  [
    vintageSet,
    new GameConstraint(
      vintageSet.name,
      ConstraintType.Set,
      `set:${vintageSet.code}`,
    ),
  ],
  [
    modernSet,
    new GameConstraint(
      modernSet.name,
      ConstraintType.Set,
      `set:${modernSet.code}`,
    ),
  ],
  [
    noReleaseAtSet,
    new GameConstraint(
      noReleaseAtSet.name,
      ConstraintType.Set,
      `set:${noReleaseAtSet.code}`,
    ),
  ],
  [
    dayAfterFirstPioneerSet,
    new GameConstraint(
      dayAfterFirstPioneerSet.name,
      ConstraintType.Set,
      `set:${dayAfterFirstPioneerSet.code}`,
    ),
  ],
  [
    dayBeforeFirstPioneerSet,
    new GameConstraint(
      dayBeforeFirstPioneerSet.name,
      ConstraintType.Set,
      `set:${dayBeforeFirstPioneerSet.code}`,
    ),
  ],
  [
    dayBefore2013Set,
    new GameConstraint(
      dayBefore2013Set.name,
      ConstraintType.Set,
      `set:${dayBefore2013Set.code}`,
    ),
  ],
  [
    firstDayOf2013Set,
    new GameConstraint(
      firstDayOf2013Set.name,
      ConstraintType.Set,
      `set:${firstDayOf2013Set.code}`,
    ),
  ],
  [
    firstPioneerSet,
    new GameConstraint(
      firstPioneerSet.name,
      ConstraintType.Set,
      `set:${firstPioneerSet.code}`,
    ),
  ],
  [
    pioneerSet,
    new GameConstraint(
      pioneerSet.name,
      ConstraintType.Set,
      `set:${pioneerSet.code}`,
    ),
  ],
  [
    standardSet,
    new GameConstraint(
      standardSet.name,
      ConstraintType.Set,
      `set:${standardSet.code}`,
    ),
  ],
];

export const setInputs = [
  vintageSet,
  modernSet,
  noReleaseAtSet,
  dayAfterFirstPioneerSet,
  dayBeforeFirstPioneerSet,
  dayBefore2013Set,
  firstDayOf2013Set,
  firstPioneerSet,
  pioneerSet,
  standardSet,
];

export const expectedSetOutputs = [
  new GameConstraint(
    standardSet.name,
    ConstraintType.Set,
    `set:${standardSet.code}`,
  ),
  new GameConstraint(
    pioneerSet.name,
    ConstraintType.Set,
    `set:${pioneerSet.code}`,
  ),
  new GameConstraint(
    firstPioneerSet.name,
    ConstraintType.Set,
    `set:${firstPioneerSet.code}`,
  ),
  new GameConstraint(
    firstDayOf2013Set.name,
    ConstraintType.Set,
    `set:${firstDayOf2013Set.code}`,
  ),
];

export const namesToSanitizeWithExpectedResult = [
  ["Foreign Black Border", ""],
  ["Limited Edition Alpha", "Alpha"],
  ["Limited Edition Beta", "Beta"],
  ["Unlimited Edition", "Unlimited"],
  ["Revised Edition", "Revised"],
  ["Fourth Edition", "4th Edition"],
  ["Fifth Edition", "5th Edition"],
  ["Classic Sixth Edition", "6th Edition"],
  ["Seventh Edition", "7th Edition"],
  ["Eighth Edition", "8th Edition"],
  ["Ninth Edition", "9th Edition"],
  ["Tenth Edition", "10th Edition"],
  [" Set With Whitespace ", "Set With Whitespace"],
  ["OtherwiseUneditedEdition", "OtherwiseUneditedEdition"],
];
