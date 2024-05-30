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
    '/swamp.png',
    'A black mana symbol; a poorly drawn skull sillouhete on a dark gray field.'
  ),
  new GameConstraint(
    'Red',
    ConstraintType.Color,
    'c:R',
    '/mountain.png',
    'A red mana symbol; a poorly drawn fireball sillouhete on a red field.'
  ),
  new GameConstraint(
    'Green',
    ConstraintType.Color,
    'c:G',
    '/forest.png',
    'A green mana symbol; a poorly drawn tree sillouhete on a green field.'
  ),
  new GameConstraint(
    'Blue',
    ConstraintType.Color,
    'c:U',
    '/island.png',
    'A blue mana symbol; a poorly drawn water droplet sillouhete on a blue field.'
  ),
  new GameConstraint(
    'White',
    ConstraintType.Color,
    'c:W',
    '/plains.png',
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

export type Color = 'White' | 'Blue' | 'Black' | 'Red' | 'Green';
type ColorPairs = Record<Color, Record<Color, string>>;

export const colorPairs: ColorPairs = {
  "White": {
    "White": "",
    "Blue": "White Blue",
    "Black": "White Black",
    "Red": "Red White",
    "Green": "White Green"
  },
  "Blue": {
    "Blue": "",
    "Black": "Blue Black",
    "Red": "Blue Red",
    "Green": "Blue Green",
    "White": "White Blue"
  },
  "Black": {
    "Black": "",
    "Red": "Black Red",
    "Green": "Black Green",
    "White": "White Black",
    "Blue": "Blue Black"
  },
  "Red": {
    "Red": "",
    "Green": "Red Green",
    "White": "Red White",
    "Blue": "Blue Red",
    "Black": "Black Red"
  },
  "Green": {
    "White": "White Green",
    "Blue": "Blue Green",
    "Black": "Black Green",
    "Red": "Red Green",
    "Green": ""
  }
};
