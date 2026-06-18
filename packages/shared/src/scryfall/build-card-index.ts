import { type LocalCard } from "../types/local-card";
import { type LocalSet } from "../types/local-set";
import { type CardAccumulator } from "./types";
import { streamCards } from "./stream-cards";

export async function buildCardIndex(
  filePath: string,
): Promise<{ cards: LocalCard[]; sets: LocalSet[] }> {
  const accumulated = new Map<string, CardAccumulator>();
  const nameToOracleId = new Map<string, string>();
  const deferredByName = new Map<string, CardAccumulator>();
  const deferredLocalizedNames = new Map<string, Set<string>>();
  const setMap = new Map<string, LocalSet>();

  // Pass 1: walk every paper card once, accumulating the mutable sets (artist/rarity/set/
  // localizedNames) per oracle_id. English entries build the canonical accumulator; non-English
  // entries contribute only their name to localizedNames. Null-oracle_id entries are deferred
  // by card name and merged into their canonical counterpart after the stream completes.
  let pass1Count = 0;
  console.log("[buildCardIndex] Starting pass 1...");
  await streamCards(filePath, (card) => {
    if (++pass1Count % 100_000 === 0) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      const mb = (n: number) => `${Math.round(n / 1024 / 1024)}MB`;
      console.log(`[buildCardIndex] pass1: ${pass1Count} cards, heap ${mb(heapUsed)}/${mb(heapTotal)}, oracle_ids: ${accumulated.size}`);
    }
    const isEnglish = (card.lang ?? "en") === "en";

    if (!isEnglish) {
      if (card.oracle_id) {
        const existing = deferredLocalizedNames.get(card.oracle_id);
        if (existing) existing.add(card.name);
        else deferredLocalizedNames.set(card.oracle_id, new Set([card.name]));
      }
      return;
    }

    if (card.set && !setMap.has(card.set)) {
      setMap.set(card.set, {
        code: card.set,
        name: card.set_name ?? "",
        set_type: card.set_type ?? "",
        released_at: card.released_at,
      });
    }

    const artist = card.artist ?? card.card_faces?.[0]?.artist;

    if (card.oracle_id) {
      if (!nameToOracleId.has(card.name)) nameToOracleId.set(card.name, card.oracle_id);
      const existing = accumulated.get(card.oracle_id);
      if (existing) {
        if (card.rarity) existing.rarities.add(card.rarity);
        if (card.set) existing.sets.add(card.set);
        if (artist) existing.artists.add(artist);
      } else {
        accumulated.set(card.oracle_id, {
          rarities: new Set(card.rarity ? [card.rarity] : []),
          sets: new Set(card.set ? [card.set] : []),
          artists: new Set(artist ? [artist] : []),
          localizedNames: new Set(),
        });
      }
    } else {
      const existing = deferredByName.get(card.name);
      if (existing) {
        if (card.rarity) existing.rarities.add(card.rarity);
        if (card.set) existing.sets.add(card.set);
        if (artist) existing.artists.add(artist);
      } else {
        deferredByName.set(card.name, {
          rarities: new Set(card.rarity ? [card.rarity] : []),
          sets: new Set(card.set ? [card.set] : []),
          artists: new Set(artist ? [artist] : []),
          localizedNames: new Set(),
        });
      }
    }
  });

  // Merge null-oracle_id English cards into their canonical entry by name.
  deferredByName.forEach((deferred, name) => {
    const oracleId = nameToOracleId.get(name);
    if (!oracleId) return;
    const canonical = accumulated.get(oracleId);
    if (!canonical) return;
    deferred.artists.forEach((a) => canonical.artists.add(a));
    deferred.sets.forEach((s) => canonical.sets.add(s));
    deferred.rarities.forEach((r) => canonical.rarities.add(r));
  });

  // Merge non-English names into their canonical accumulators.
  deferredLocalizedNames.forEach((names, oracleId) => {
    const canonical = accumulated.get(oracleId);
    if (!canonical) return;
    names.forEach((n) => canonical.localizedNames.add(n));
  });

  console.log(`[buildCardIndex] Pass 1 complete: ${pass1Count} cards, ${accumulated.size} oracle IDs, ${deferredLocalizedNames.size} deferred localized`);

  // Between passes: release Maps that are no longer needed so GC can reclaim them.
  deferredByName.clear();
  deferredLocalizedNames.clear();
  nameToOracleId.clear();
  (globalThis as { gc?: () => void }).gc?.();
  console.log("[buildCardIndex] Starting pass 2...");

  // Pass 2: stream again, using the first English occurrence of each oracle_id to build
  // the full LocalCard. Drain accumulated as we go to free memory incrementally.
  const cards: LocalCard[] = [];
  const processed = new Set<string>();
  let pass2Count = 0;

  await streamCards(filePath, (card) => {
    if (++pass2Count % 100_000 === 0) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      const mb = (n: number) => `${Math.round(n / 1024 / 1024)}MB`;
      console.log(`[buildCardIndex] pass2: ${pass2Count} cards, heap ${mb(heapUsed)}/${mb(heapTotal)}, built: ${cards.length}`);
    }
    if (!card.oracle_id || (card.lang ?? "en") !== "en") return;
    if (processed.has(card.oracle_id)) return;
    processed.add(card.oracle_id);

    const acc = accumulated.get(card.oracle_id)!;
    accumulated.delete(card.oracle_id);

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

    cards.push({
      name: card.name,
      faceNames: faces.map((f) => f.name ?? "").filter(Boolean),
      type_line: card.type_line ?? "",
      colors,
      cmc: card.cmc ?? 0,
      rarities: Array.from(acc.rarities),
      oracle_text,
      power: card.power ?? faces[0]?.power,
      toughness: card.toughness ?? faces[0]?.toughness,
      artists: Array.from(acc.artists),
      localizedNames: Array.from(acc.localizedNames),
      sets: Array.from(acc.sets),
      set: card.set ?? "",
      set_name: card.set_name ?? "",
      set_type: card.set_type ?? "",
      released_at: card.released_at,
      imagePng,
    });
  });

  console.log(`[buildCardIndex] Pass 2 complete: ${cards.length} unique cards built`);
  return { cards, sets: Array.from(setMap.values()) };
}
