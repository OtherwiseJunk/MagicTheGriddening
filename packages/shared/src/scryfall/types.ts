export interface ScryfallBulkFace {
  name?: string;
  colors?: string[];
  oracle_text?: string;
  artist?: string;
  power?: string;
  toughness?: string;
  image_uris?: { png: string };
}

export interface ScryfallBulkCard {
  name: string;
  oracle_id?: string;
  lang?: string;
  type_line?: string;
  colors?: string[];
  color_identity?: string[];
  cmc?: number;
  rarity?: string;
  oracle_text?: string;
  artist?: string;
  power?: string;
  toughness?: string;
  set?: string;
  set_name?: string;
  set_type?: string;
  released_at?: string;
  image_uris?: { png: string };
  card_faces?: ScryfallBulkFace[];
  games?: string[];
}

export interface ScryfallBulkDataManifest {
  data: ScryfallBulkDataFile[];
}

export interface ScryfallBulkDataFile {
  type: string;
  updated_at: string;
  download_uri: string;
}

export interface CardAccumulator {
  rarities: Set<string>;
  sets: Set<string>;
  artists: Set<string>;
  localizedNames: Set<string>;
}
