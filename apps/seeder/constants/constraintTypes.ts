import { GameConstraint, ConstraintType, makeTypeFilter } from "@griddening/shared";

// The canonical constraint definitions now live in @griddening/shared so the seeder (grid
// generation) and the web app (guess validation) share one source of truth. Re-exported here
// so existing seeder imports keep working unchanged.
export {
  cardTypeConstraints,
  creatureRaceConstraints,
  creatureJobConstraints,
  artifactSubtypesConstraints,
  enchantmentSubtypeTypeConstraints,
  rarityConstraints,
  creatureRulesTextConstraints,
  artistConstraints,
  colorConstraints,
  manaValueConstraints,
  toughnessConstraints,
  powerConstraints,
  nonLandNonArtifact,
  colorless,
} from "@griddening/shared";

// Layout-only subsets: grid-generation policy (which creature race pools are safe for power /
// toughness slots), not constraint definitions. They stay seeder-side, built from the shared
// type filter.

// Creatures that regularly have power ≥ 5 — safe for power-slot layouts
const powerCompatibleRaceTypes = [
  "Dragon",
  "Eldrazi",
  "Hydra",
  "Angel",
  "Demon",
  "Dinosaur",
  "Sphinx",
  "Horror",
  "Beast",
  "Elemental",
  "God",
  "Phyrexian",
  "Werewolf",
];

// Creatures with regularly high toughness — power pool + defensively large types
const toughnessCompatibleRaceTypes = [
  ...powerCompatibleRaceTypes,
  "Wall", // 0 power but high toughness is the whole design
  "Treefolk", // notorious for high toughness (Doran, Indomitable Ancients)
  "Spider", // reach + high toughness is the Spider identity
];

export const powerCompatibleRaceConstraints: GameConstraint[] = powerCompatibleRaceTypes.map(
  (cardType) => {
    const constraint = new GameConstraint(cardType, ConstraintType.CreatureRaceTypes, `t:${cardType}`);
    constraint.localFilter = makeTypeFilter(cardType);
    return constraint;
  },
);

export const toughnessCompatibleRaceConstraints: GameConstraint[] = toughnessCompatibleRaceTypes.map(
  (cardType) => {
    const constraint = new GameConstraint(cardType, ConstraintType.CreatureRaceTypes, `t:${cardType}`);
    constraint.localFilter = makeTypeFilter(cardType);
    return constraint;
  },
);
