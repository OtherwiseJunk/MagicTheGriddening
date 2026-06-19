import { type ScryfallBulkCard, type ScryfallBulkFace, type LocalCard } from "@griddening/shared";

export type { LocalCard, CardIndexFile } from "@griddening/shared/types";

// Build the name -> card lookup. Real card names are mapped first so a standalone card always
// wins; face names only fill keys that aren't already a real card name. This prevents a card
// whose face name collides with a real card (e.g. a leftover art/placeholder printing, or a
// split half) from clobbering the real card on guess lookup.
export function buildNameIndex(cards: LocalCard[]): Map<string, LocalCard> {
  const map = new Map<string, LocalCard>();
  for (const card of cards) {
    if (!map.has(card.name)) map.set(card.name, card);
  }
  for (const card of cards) {
    for (const faceName of card.faceNames) {
      if (!map.has(faceName)) map.set(faceName, card);
    }
  }
  return map;
}

export function buildLocalCards(rawCards: ScryfallBulkCard[]): LocalCard[] {
  const groups = new Map<string, ScryfallBulkCard[]>();
  const nameToOracleId = new Map<string, string>();
  const deferred: ScryfallBulkCard[] = [];
  const localizedNamesMap = new Map<string, Set<string>>();

  for (const card of rawCards) {
    if (!(card.games?.includes("paper") ?? false)) continue;
    if ((card.lang ?? "en") !== "en") {
      if (card.oracle_id) {
        const existing = localizedNamesMap.get(card.oracle_id);
        if (existing) existing.add(card.name);
        else localizedNamesMap.set(card.oracle_id, new Set([card.name]));
      }
      continue;
    }
    if (card.oracle_id) {
      if (!nameToOracleId.has(card.name)) nameToOracleId.set(card.name, card.oracle_id);
      const group = groups.get(card.oracle_id);
      if (group) {
        group.push(card);
      } else {
        groups.set(card.oracle_id, [card]);
      }
    } else {
      deferred.push(card);
    }
  }

  for (const card of deferred) {
    const oracleId = nameToOracleId.get(card.name);
    if (!oracleId) continue;
    groups.get(oracleId)?.push(card);
  }

  return Array.from(groups.entries()).map(([oracleId, printings]) => {
    const canonical = printings[0];
    const faces: ScryfallBulkFace[] = canonical.card_faces ?? [];

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
    const imagePng =
      canonical.image_uris?.png ?? faces[0]?.image_uris?.png ?? "/card-not-found.png";

    const rarities = Array.from(
      new Set(printings.map((p) => p.rarity).filter((r): r is string => r !== undefined)),
    );
    const sets = Array.from(
      new Set(printings.map((p) => p.set).filter((s): s is string => s !== undefined)),
    );
    const artists = Array.from(
      new Set(printings.map((p) => p.artist ?? p.card_faces?.[0]?.artist ?? "").filter(Boolean)),
    );
    const localizedNames = Array.from(localizedNamesMap.get(oracleId) ?? []);

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
      localizedNames,
      sets,
      set: canonical.set ?? "",
      set_name: canonical.set_name ?? "",
      set_type: canonical.set_type ?? "",
      released_at: canonical.released_at,
      imagePng,
    };
  });
}
