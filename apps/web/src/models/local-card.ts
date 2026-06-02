interface ScryfallBulkFace {
  name?: string;
  colors?: string[];
  oracle_text?: string;
  artist?: string;
  power?: string;
  toughness?: string;
  image_uris?: { png: string };
}

interface ScryfallBulkCard {
  name: string;
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
  image_uris?: { png: string };
  card_faces?: ScryfallBulkFace[];
  games?: string[];
}

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
  imagePng: string;
}

export interface CardIndexFile {
  generatedAt: string;
  sourceUpdatedAt: string;
  cards: LocalCard[];
}

export function buildLocalCards(rawCards: ScryfallBulkCard[]): LocalCard[] {
  return rawCards
    .filter((card) => card.games?.includes("paper") ?? false)
    .map((card) => {
      const faces = card.card_faces ?? [];
      // Use Array.from rather than spread — tsconfig targets es5
      const faceColors =
        faces.length > 0 ? Array.from(new Set(faces.flatMap((f) => f.colors ?? []))) : undefined;
      // Fall back to color_identity when face union is empty (colorless DFCs)
      const colors =
        card.colors !== undefined
          ? card.colors
          : faceColors !== undefined && faceColors.length > 0
            ? faceColors
            : (card.color_identity ?? []);
      const oracle_text =
        card.oracle_text ??
        faces
          .map((f) => f.oracle_text ?? "")
          .filter(Boolean)
          .join("\n");
      const imagePng = card.image_uris?.png ?? faces[0]?.image_uris?.png ?? "/card-not-found.png";

      return {
        name: card.name,
        faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
        type_line: card.type_line ?? "",
        colors,
        cmc: card.cmc ?? 0,
        rarity: card.rarity ?? "",
        oracle_text,
        power: card.power ?? faces[0]?.power,
        toughness: card.toughness ?? faces[0]?.toughness,
        artist: card.artist ?? faces[0]?.artist ?? "",
        set: card.set ?? "",
        imagePng,
      };
    });
}
