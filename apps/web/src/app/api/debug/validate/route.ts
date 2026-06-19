import { findConstraintByName, type GameConstraint } from "@griddening/shared";
import CardValidationService from "@/services/card-validation.service";
import { type LocalCard } from "@/models/local-card";

// Flag-gated diagnostic endpoint. For a card name and two constraint names it reports, per
// constraint, what BOTH validators decide: the web guess-validator (matchesConstraint) and the
// seeder's generation truth (the constraint's localFilter). Disagreements (agree:false) pinpoint
// why a card that grid generation guaranteed gets rejected on submit. Enabled only when
// ENABLE_DEBUG_API === "true"; otherwise it does not exist (404).

interface ValidateRequest {
  cardName?: unknown;
  constraints?: unknown;
}

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

function cardSummary(card: LocalCard): object {
  return {
    name: card.name,
    artists: card.artists,
    colors: card.colors,
    type_line: card.type_line,
    cmc: card.cmc,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    rarities: card.rarities,
    sets: card.sets,
    oracle_text: card.oracle_text,
  };
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.ENABLE_DEBUG_API !== "true") {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const body = (await request.json()) as ValidateRequest;
    const { cardName, constraints: names } = body;

    if (typeof cardName !== "string" || cardName.trim() === "") {
      return jsonResponse({ error: "cardName must be a non-empty string" }, 400);
    }
    if (
      !Array.isArray(names) ||
      names.length !== 2 ||
      !names.every((n) => typeof n === "string")
    ) {
      return jsonResponse(
        { error: "constraints must be an array of exactly two constraint names" },
        400,
      );
    }

    const resolved: GameConstraint[] = [];
    const unknown: string[] = [];
    for (const name of names as string[]) {
      const constraint = findConstraintByName(name);
      if (constraint) resolved.push(constraint);
      else unknown.push(name);
    }
    if (unknown.length > 0) {
      return jsonResponse({ error: `Unknown constraint(s): ${unknown.join(", ")}` }, 400);
    }

    const card = await CardValidationService.findCard(cardName);

    const constraints = resolved.map((c) => {
      const webMatch = card ? CardValidationService.matchesConstraint(card, c) : null;
      const filterMatch = card && c.localFilter ? c.localFilter(card) : null;
      return {
        name: c.displayName,
        constraintType: c.constraintType,
        scryfallQuery: c.scryfallQuery,
        webMatch,
        filterMatch,
        agree: webMatch === filterMatch,
      };
    });

    return jsonResponse(
      {
        found: card !== undefined,
        matchedName: card?.name ?? null,
        card: card ? cardSummary(card) : null,
        constraints,
        matchesAll: card !== undefined && constraints.every((c) => c.webMatch === true),
      },
      200,
    );
  } catch (error) {
    console.error("Error in debug validate:", error);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
}
