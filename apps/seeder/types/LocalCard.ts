export interface LocalCard {
  name: string;
  faceNames: string[];
  type_line: string;
  colors: string[];
  cmc: number;
  rarity: string;
  oracle_text: string;
  power: string | undefined;
  toughness: string | undefined;
  artist: string;
  set: string;
  set_name: string;
  set_type: string;
  released_at: string | undefined;
  imagePng: string;
}
