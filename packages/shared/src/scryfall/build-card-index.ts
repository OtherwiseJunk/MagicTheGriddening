import { type LocalCard } from "../types/local-card";
import { type LocalSet } from "../types/local-set";
import { type ScryfallBulkCard } from "./types";
import { streamCards } from "./stream-cards";

// stream-json emits every JSON string value as a V8 SlicedString over the multi-KB parse
// buffer it was decoded from (`s += buffer.slice(...)` in its parser). Retaining one such
// slice pins the entire backing buffer, so holding tens of thousands of names / oracle_ids /
// oracle_text across the stream leaks gigabytes even though their logical content is a few MB.
// A Buffer round-trip forces a standalone, flat copy. V8 only slices strings >= 13 chars, so
// short codes (set, rarity, colors, dates) are already standalone and left untouched.
//
// Flatten only at the moment a string is *inserted* into a long-lived container: Map/Set
// lookups compare by content, not representation, so we can probe with the raw slice and copy
// only the ~tens of thousands of strings we actually keep — not the ~millions we merely read.
function flat(s: string): string {
  return s.length < 13 ? s : Buffer.from(s, "utf8").toString("utf8");
}

// Accumulated per oracle_id: the canonical card (static fields from its first English printing)
// plus the mutable sets unioned across every printing/language.
interface CardEntry {
  card: LocalCard;
  rarities: Set<string>;
  sets: Set<string>;
  artists: Set<string>;
  localizedNames: Set<string>;
}

// English printings with a null oracle_id are deferred and merged into the canonical entry that
// shares their name once the stream completes (their oracle counterpart may appear later).
interface DeferredPrinting {
  rarities: Set<string>;
  sets: Set<string>;
  artists: Set<string>;
}

// Build the immutable, single-printing-derived fields of a LocalCard from its first English
// printing. Array fields (rarities/artists/localizedNames/sets) start empty and are filled from
// the accumulated sets after the stream completes.
function buildCanonicalCard(card: ScryfallBulkCard): LocalCard {
  const faces = card.card_faces ?? [];
  const faceColors =
    faces.length > 0 ? Array.from(new Set(faces.flatMap((f) => f.colors ?? []))) : undefined;
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
    name: flat(card.name),
    faceNames: faces.map((f) => flat(f.name ?? "")).filter(Boolean),
    type_line: flat(card.type_line ?? ""),
    colors,
    cmc: card.cmc ?? 0,
    rarities: [],
    oracle_text: flat(oracle_text),
    power: card.power ?? faces[0]?.power,
    toughness: card.toughness ?? faces[0]?.toughness,
    artists: [],
    localizedNames: [],
    sets: [],
    set: card.set ?? "",
    set_name: flat(card.set_name ?? ""),
    set_type: flat(card.set_type ?? ""),
    released_at: card.released_at,
    imagePng: flat(imagePng),
  };
}

export async function buildCardIndex(
  filePath: string,
): Promise<{ cards: LocalCard[]; sets: LocalSet[] }> {
  const byOracle = new Map<string, CardEntry>();
  const nameToOracleId = new Map<string, string>();
  const deferredByName = new Map<string, DeferredPrinting>();
  const deferredLocalizedNames = new Map<string, Set<string>>();
  const setMap = new Map<string, LocalSet>();

  const mb = (n: number) => `${Math.round(n / 1024 / 1024)}MB`;

  // Single pass: the first English printing of each oracle_id builds the canonical card; every
  // printing unions its rarity/set/artist into that entry. Non-English printings contribute only
  // their name (localizedNames), and null-oracle_id English printings are deferred by name. Both
  // deferral maps are resolved after the stream, since a card's canonical entry may appear after
  // the printing that references it.
  let count = 0;
  console.log("[buildCardIndex] Starting stream...");
  await streamCards(filePath, (card) => {
    if (++count % 100_000 === 0) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      console.log(
        `[buildCardIndex] streamed ${count} cards, heap ${mb(heapUsed)}/${mb(heapTotal)}, oracle_ids: ${byOracle.size}`,
      );
    }

    if ((card.lang ?? "en") !== "en") {
      if (card.oracle_id) {
        const existing = deferredLocalizedNames.get(card.oracle_id);
        if (existing) existing.add(flat(card.name));
        else deferredLocalizedNames.set(flat(card.oracle_id), new Set([flat(card.name)]));
      }
      return;
    }

    if (card.set && !setMap.has(card.set)) {
      setMap.set(card.set, {
        code: card.set,
        name: flat(card.set_name ?? ""),
        set_type: flat(card.set_type ?? ""),
        released_at: card.released_at,
      });
    }

    const artist = card.artist ?? card.card_faces?.[0]?.artist;

    if (card.oracle_id) {
      if (!nameToOracleId.has(card.name)) nameToOracleId.set(flat(card.name), flat(card.oracle_id));
      const entry = byOracle.get(card.oracle_id);
      if (entry) {
        if (card.rarity) entry.rarities.add(card.rarity);
        if (card.set) entry.sets.add(card.set);
        if (artist && !entry.artists.has(artist)) entry.artists.add(flat(artist));
      } else {
        byOracle.set(flat(card.oracle_id), {
          card: buildCanonicalCard(card),
          rarities: new Set(card.rarity ? [card.rarity] : []),
          sets: new Set(card.set ? [card.set] : []),
          artists: new Set(artist ? [flat(artist)] : []),
          localizedNames: new Set(),
        });
      }
    } else {
      const deferred = deferredByName.get(card.name);
      if (deferred) {
        if (card.rarity) deferred.rarities.add(card.rarity);
        if (card.set) deferred.sets.add(card.set);
        if (artist && !deferred.artists.has(artist)) deferred.artists.add(flat(artist));
      } else {
        deferredByName.set(flat(card.name), {
          rarities: new Set(card.rarity ? [card.rarity] : []),
          sets: new Set(card.set ? [card.set] : []),
          artists: new Set(artist ? [flat(artist)] : []),
        });
      }
    }
  });

  // Merge null-oracle_id English printings into their canonical entry by name.
  deferredByName.forEach((deferred, name) => {
    const oracleId = nameToOracleId.get(name);
    if (!oracleId) return;
    const entry = byOracle.get(oracleId);
    if (!entry) return;
    deferred.artists.forEach((a) => entry.artists.add(a));
    deferred.sets.forEach((s) => entry.sets.add(s));
    deferred.rarities.forEach((r) => entry.rarities.add(r));
  });

  // Merge non-English names into their canonical entry.
  deferredLocalizedNames.forEach((names, oracleId) => {
    const entry = byOracle.get(oracleId);
    if (!entry) return;
    names.forEach((n) => entry.localizedNames.add(n));
  });

  // Flush the accumulated sets onto each canonical card.
  const cards: LocalCard[] = [];
  byOracle.forEach((entry) => {
    entry.card.rarities = Array.from(entry.rarities);
    entry.card.artists = Array.from(entry.artists);
    entry.card.localizedNames = Array.from(entry.localizedNames);
    entry.card.sets = Array.from(entry.sets);
    cards.push(entry.card);
  });

  console.log(`[buildCardIndex] Complete: ${count} cards streamed, ${cards.length} unique cards built`);
  return { cards, sets: Array.from(setMap.values()) };
}
