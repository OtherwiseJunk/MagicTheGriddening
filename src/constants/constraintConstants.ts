import { GameConstraint, ConstraintType } from '@/models/UI/gameConstraint'

const cardTypes = [
  // Card Types
  'Sorcery',
  'Instant',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
  'Equipment',
  'Legendary',

  // Creature Types
  'Goblin',
  'Elf',
  'Merfolk',
  'Zombie',
  'Human',
  'Cleric',
  'Beast',
  'Elemental',
  'Spirit',
  'Soldier',
  'Warrior',
  'Wizard',
  'Aura',
  'Dragon',
  'Rogue',
  'Angel',
  'Hydra',
  'Demon',
  'Sphinx',
  'Treefolk'
]

export const typeConstraints: GameConstraint[] = cardTypes.map(
  (cardType) => new GameConstraint(cardType, ConstraintType.Type, `t:${cardType}`)
)

export const rarityConstraints: GameConstraint[] = [
  new GameConstraint('Mythic', ConstraintType.Rarity, 'r:m'),
  new GameConstraint('Rare', ConstraintType.Rarity, 'r:r'),
  new GameConstraint('Uncommon', ConstraintType.Rarity, 'r:u'),
  new GameConstraint('Common', ConstraintType.Rarity, 'r:c')
]

export const colorConstraints: GameConstraint[] = [
  new GameConstraint(
    'Black',
    ConstraintType.Color,
    'c:B',
    'swamp.png',
    'A black mana symbol; a poorly drawn skull sillouhete on a dark gray field.'
  ),
  /* Colorless is kind of a paint right now because you can't have a Colorless-Green (etc) creature
     Probably when I go to fix this when we "Draw" a colorless constraint we'll have the other constraint be Land or Artifact?
     But that will take some finessing and I want to find a cleverer way of generating these.

    new GameConstraint(
        "Colorless",
        ConstraintType.Color,
        "colorless.png",
        "A black mana symbol; a poorly drawn skull sillouhete on a dark gray field."
    ), */
  new GameConstraint(
    'Red',
    ConstraintType.Color,
    'c:R',
    'mountain.png',
    'A red mana symbol; a poorly drawn fireball sillouhete on a red field.'
  ),
  new GameConstraint(
    'Green',
    ConstraintType.Color,
    'c:G',
    'forest.png',
    'A green mana symbol; a poorly drawn tree sillouhete on a green field.'
  ),
  new GameConstraint(
    'Blue',
    ConstraintType.Color,
    'c:U',
    'island.png',
    'A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field.'
  ),
  new GameConstraint(
    'White',
    ConstraintType.Color,
    'c:W',
    'plains.png',
    'A white mana symbol; a poorly drawn sun sillouhete on a pale yellow field.'
  )
]

export const manaValueConstraints: GameConstraint[] = Array.from(
  { length: 9 },
  (_, index) =>
    new GameConstraint(
      `Mana Value ${index}`,
      ConstraintType.ManaValue,
      `cmc:${index}`
    )
)
