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
  oracle_id?: string;
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

export interface LocalCard {
  name: string;
  faceNames: string[];
  type_line: string;
  colors: string[];
  cmc: number;
  rarities: string[];
  oracle_text: string;
  power: string | undefined;
  toughness: string | undefined;
  artists: string[];
  sets: string[];
  set: string;
  set_name: string;
  set_type: string;
  released_at: string | undefined;
  imagePng: string;
}

export interface CardIndexFile {
  generatedAt: string;
  sourceUpdatedAt: string;
  cards: LocalCard[];
}

export function buildLocalCards(rawCards: ScryfallBulkCard[]): LocalCard[] {
  const groups = new Map<string, ScryfallBulkCard[]>();

  for (const card of rawCards) {
    if (!(card.games?.includes("paper") ?? false)) continue;
    const key = card.oracle_id ?? card.name;
    const group = groups.get(key);
    if (group) {
      group.push(card);
    } else {
      groups.set(key, [card]);
    }
  }

  return Array.from(groups.values()).map((printings) => {
    const canonical = printings[0];
    const faces = canonical.card_faces ?? [];

    const faceColors =
      faces.length > 0 ? Array.from(new Set(faces.flatMap((f) => f.colors ?? []))) : undefined;
    const colors =
      canonical.colors !== undefined
        ? canonical.colors
        : faceColors !== undefined && faceColors.length > 0
          ? faceColors
          : (canonical.color_identity ?? []);
    const oracle_text =
      canonical.oracle_text ??
      faces
        .map((f) => f.oracle_text ?? "")
        .filter(Boolean)
        .join("\n");
    const imagePng = canonical.image_uris?.png ?? faces[0]?.image_uris?.png ?? "/card-not-found.png";

    const rarities = Array.from(
      new Set(printings.map((p) => p.rarity).filter((r): r is string => r !== undefined)),
    );
    const sets = Array.from(
      new Set(printings.map((p) => p.set).filter((s): s is string => s !== undefined)),
    );
    const artists = Array.from(
      new Set(
        printings
          .map((p) => p.artist ?? p.card_faces?.[0]?.artist ?? "")
          .filter(Boolean),
      ),
    );

    return {
      name: canonical.name,
      faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
      type_line: canonical.type_line ?? "",
      colors,
      cmc: canonical.cmc ?? 0,
      rarities,
      oracle_text,
      power: canonical.power ?? faces[0]?.power,
      toughness: canonical.toughness ?? faces[0]?.toughness,
      artists,
      sets,
      set: canonical.set ?? "",
      set_name: canonical.set_name ?? "",
      set_type: canonical.set_type ?? "",
      released_at: canonical.released_at,
      imagePng,
    };
  });
}
