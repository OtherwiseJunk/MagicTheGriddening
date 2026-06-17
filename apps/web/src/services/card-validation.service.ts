import { type LocalCard } from "@/models/local-card";
import { type GameConstraint, ConstraintType } from "@/models/UI/gameConstraint";
import BulkDataService from "@/services/bulk-data.service";

const RARITY_MAP: Record<string, string> = {
  m: "mythic",
  r: "rare",
  u: "uncommon",
  c: "common",
};

function matchesTypeQuery(typeLine: string, query: string): boolean {
  const lower = typeLine.toLowerCase();
  for (const part of query.split(" ")) {
    if (part.startsWith("-t:")) {
      if (lower.includes(part.slice(3).toLowerCase())) return false;
    } else if (part.startsWith("t:")) {
      if (!lower.includes(part.slice(2).toLowerCase())) return false;
    }
  }
  return true;
}

function matchesColorQuery(colors: string[], query: string): boolean {
  for (const part of query.split(" ")) {
    if (part.startsWith("-c:")) {
      if (colors.includes(part.slice(3))) return false;
    } else if (part.startsWith("c:")) {
      const color = part.slice(2);
      if (color === "C") {
        if (colors.length !== 0) return false;
      } else {
        if (!colors.includes(color)) return false;
      }
    }
  }
  return true;
}

function matchesOracleTextQuery(oracleText: string, query: string, cardName: string): boolean {
  const match = /^o:"([^"]+)"|^o:(\S+)/.exec(query);
  if (match === null) return false;
  const searchText = (match[1] ?? match[2]).replace(/~/g, cardName).toLowerCase();
  return oracleText.toLowerCase().includes(searchText);
}

export function matchesConstraint(card: LocalCard, constraint: GameConstraint): boolean {
  const { constraintType, scryfallQuery } = constraint;
  const nameForSubstitution = card.faceNames[0] ?? card.name;

  switch (constraintType) {
    case ConstraintType.Type:
    case ConstraintType.CreatureRaceTypes:
    case ConstraintType.CreatureJobTypes:
    case ConstraintType.ArtifactSubtypes:
    case ConstraintType.EnchantmentSubtypes:
      return matchesTypeQuery(card.type_line, scryfallQuery);
    case ConstraintType.Rarity:
      return card.rarities.includes(RARITY_MAP[scryfallQuery.slice(2)] ?? "");
    case ConstraintType.Color:
      return matchesColorQuery(card.colors, scryfallQuery);
    case ConstraintType.ManaValue:
      return card.cmc === Number(scryfallQuery.slice(4));
    case ConstraintType.Power:
      return card.power !== undefined && card.power === scryfallQuery.slice(4);
    case ConstraintType.Toughness:
      return card.toughness !== undefined && card.toughness === scryfallQuery.slice(4);
    case ConstraintType.Artist:
      return card.artists.some((a) =>
        a.toLowerCase().includes(scryfallQuery.slice(2).toLowerCase()),
      );
    case ConstraintType.CreatureRulesText:
      return matchesOracleTextQuery(card.oracle_text, scryfallQuery, nameForSubstitution);
    case ConstraintType.Set:
      return card.sets.includes(scryfallQuery.slice(4));
    default:
      return false;
  }
}

export default class CardValidationService {
  static async findCard(name: string): Promise<LocalCard | undefined> {
    return BulkDataService.findCard(name);
  }

  static matchesConstraint(card: LocalCard, constraint: GameConstraint): boolean {
    return matchesConstraint(card, constraint);
  }

  static matchesAllConstraints(card: LocalCard, constraints: GameConstraint[]): boolean {
    return constraints.every((c) => matchesConstraint(card, c));
  }
}
