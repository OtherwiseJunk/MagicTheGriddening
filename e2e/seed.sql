-- E2E test seed data
-- Covers all 12 ConstraintType variants across 3 puzzles

-- Puzzle 1: Color, Power, Rarity (top) x Type, ManaValue, Toughness (side)
-- dateString 20260101 (using 0-indexed months, this represents February 1st)
INSERT INTO "Game" ("dateString", "constraintsJSON") VALUES (
  '20260101',
  '[
    {"displayName":"Red","constraintType":3,"scryfallQuery":"c:R","imageSrc":"/mountain.png","imageAltText":"A red mana symbol"},
    {"displayName":"Power 2","constraintType":5,"scryfallQuery":"pow:2","imageSrc":"","imageAltText":""},
    {"displayName":"Common","constraintType":0,"scryfallQuery":"r:c","imageSrc":"","imageAltText":""},
    {"displayName":"Goblin","constraintType":1,"scryfallQuery":"t:Goblin","imageSrc":"","imageAltText":""},
    {"displayName":"Mana Value 2","constraintType":2,"scryfallQuery":"cmc:2","imageSrc":"","imageAltText":""},
    {"displayName":"Toughness 2","constraintType":6,"scryfallQuery":"tou:2","imageSrc":"","imageAltText":""}
  ]'
);

-- Puzzle 2: Set, Artist, CreatureRulesText (top) x CreatureRaceTypes, CreatureJobTypes, Color (side)
-- dateString 20260102
INSERT INTO "Game" ("dateString", "constraintsJSON") VALUES (
  '20260102',
  '[
    {"displayName":"Lorwyn","constraintType":4,"scryfallQuery":"set:lrw","imageSrc":"","imageAltText":""},
    {"displayName":"Rebecca Guay","constraintType":7,"scryfallQuery":"a:Guay","imageSrc":"","imageAltText":""},
    {"displayName":"Flying","constraintType":8,"scryfallQuery":"o:Flying","imageSrc":"","imageAltText":""},
    {"displayName":"Elf","constraintType":10,"scryfallQuery":"t:Elf","imageSrc":"","imageAltText":""},
    {"displayName":"Wizard","constraintType":11,"scryfallQuery":"t:Wizard","imageSrc":"","imageAltText":""},
    {"displayName":"Blue","constraintType":3,"scryfallQuery":"c:U","imageSrc":"/island.png","imageAltText":"A blue mana symbol"}
  ]'
);

-- Puzzle 3: ArtifactSubtypes, EnchantmentSubtypes, Color (top) x Power, CreatureRaceTypes, Rarity (side)
-- dateString 20260103
INSERT INTO "Game" ("dateString", "constraintsJSON") VALUES (
  '20260103',
  '[
    {"displayName":"Equipment","constraintType":12,"scryfallQuery":"t:Equipment","imageSrc":"","imageAltText":""},
    {"displayName":"Aura","constraintType":13,"scryfallQuery":"t:Aura","imageSrc":"","imageAltText":""},
    {"displayName":"Green","constraintType":3,"scryfallQuery":"c:G","imageSrc":"/forest.png","imageAltText":"A green mana symbol"},
    {"displayName":"Power 1","constraintType":5,"scryfallQuery":"pow:1","imageSrc":"","imageAltText":""},
    {"displayName":"Human","constraintType":10,"scryfallQuery":"t:Human","imageSrc":"","imageAltText":""},
    {"displayName":"Uncommon","constraintType":0,"scryfallQuery":"r:u","imageSrc":"","imageAltText":""}
  ]'
);
