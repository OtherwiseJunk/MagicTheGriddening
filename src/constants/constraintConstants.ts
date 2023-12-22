import { GameConstraint, ConstraintType } from "@/models/UI/gameConstraint";

  export const typeConstraints: GameConstraint[] = [
    new GameConstraint("Sorcery", ConstraintType.Type),
    new GameConstraint("Instant", ConstraintType.Type),
    new GameConstraint("Enchantment", ConstraintType.Type),
    new GameConstraint("Artifact", ConstraintType.Type),
    new GameConstraint("Planeswalker", ConstraintType.Type),
    new GameConstraint("Land", ConstraintType.Type),
    new GameConstraint("Equipment", ConstraintType.Type),
    new GameConstraint("Legendary", ConstraintType.Type),
    new GameConstraint("Goblin", ConstraintType.Type),
    new GameConstraint("Elf", ConstraintType.Type),
    new GameConstraint("Merfolk", ConstraintType.Type),
    new GameConstraint("Zombie", ConstraintType.Type),
    new GameConstraint("Human", ConstraintType.Type),
    new GameConstraint("Sliver", ConstraintType.Type),
    new GameConstraint("Legendary", ConstraintType.Type),
    new GameConstraint("Beast", ConstraintType.Type),
    new GameConstraint("Cleric", ConstraintType.Type),
    new GameConstraint("Elemental", ConstraintType.Type),
    new GameConstraint("Spirit", ConstraintType.Type),
    new GameConstraint("Soldier", ConstraintType.Type),
    new GameConstraint("Warrior", ConstraintType.Type),
    new GameConstraint("Wizard", ConstraintType.Type),
    new GameConstraint("Warrior", ConstraintType.Type),
    new GameConstraint("Aura", ConstraintType.Type),
    new GameConstraint("Dragon", ConstraintType.Type),
    new GameConstraint("Rogue", ConstraintType.Type),
    new GameConstraint("Angel", ConstraintType.Type),
    new GameConstraint("Hydra", ConstraintType.Type),
    new GameConstraint("Demon", ConstraintType.Type),
    new GameConstraint("Sphinx", ConstraintType.Type),
    new GameConstraint("Treefolk", ConstraintType.Type),
]

export const rarityConstraints: GameConstraint[] = [
    new GameConstraint("Mythic", ConstraintType.Rarity),
    new GameConstraint("Rare", ConstraintType.Rarity),
    new GameConstraint("Uncommon", ConstraintType.Rarity),
    new GameConstraint("Common", ConstraintType.Rarity)
]

export const colorConstraints: GameConstraint[] = [
    new GameConstraint(
        "Black",
        ConstraintType.Color,
        "swamp.png",
        "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field."
    ),
    /* Colorless is kind of a paint right now because you can't have a Colorless-Green (etc) creature

    new GameConstraint(
        "Colorless",
        ConstraintType.Color,
        "colorless.png",
        "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field."
    ),*/
    new GameConstraint(
        "Red",
        ConstraintType.Color,
        "mountain.png",
        "A red mana symbol; a poorly drawn fireball sillouhete on a red field."
    ),
    new GameConstraint(
        "Green",
        ConstraintType.Color,
        "forest.png",
        "A green mana symbol; a poorly drawn tree sillouhete on a green field."
    ),
    new GameConstraint(
        "Blue",
        ConstraintType.Color,
        "island.png",
        "A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field."
    ),
    new GameConstraint(
        "White",
        ConstraintType.Color,
        "plains.png",
        "A white mana symbol; a poorly drawn sun sillouhete on a pale yellow field."
    )
]

export const manaValueConstraints: GameConstraint[] = Array.from({ length: 9 }, (_, index) => new GameConstraint(`Mana Value ${index}`, ConstraintType.ManaValue));