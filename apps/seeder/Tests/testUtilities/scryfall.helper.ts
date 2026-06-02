/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Scry from "scryfall-sdk";
import { MagicArray } from "scryfall-sdk/out/util/MagicEmitter";

export class ScryfallHelper {
  static generateScryfallSet(
    set_released_at: string | undefined,
    set_name: string,
    set_code: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set_type: any = "core",
  ): Scry.Set {
    return {
      object: "set",
      id: "",
      code: set_code,
      name: set_name,
      set_type: set_type,
      card_count: 0,
      digital: false,
      foil_only: false,
      nonfoil_only: false,
      scryfall_uri: "",
      uri: "",
      icon_svg_uri: "",
      search_uri: "",
      released_at: set_released_at,
      getCards: function (
        options?:
          | {
              unique?: "cards" | "art" | "prints" | undefined;
              order?:
                | "name"
                | "set"
                | "released"
                | "rarity"
                | "color"
                | "usd"
                | "tix"
                | "eur"
                | "cmc"
                | "power"
                | "toughness"
                | "edhrec"
                | "artist"
                | undefined;
              dir?: "auto" | "asc" | "desc" | undefined;
              include_extras?: boolean | undefined;
              include_multilingual?: boolean | undefined;
              include_variations?: boolean | undefined;
            }
          | undefined,
      ): Promise<Scry.Card[]> {
        throw new Error("Function not implemented.");
      },
      search: function (
        query: string,
        options?:
          | {
              unique?: "cards" | "art" | "prints" | undefined;
              order?:
                | "name"
                | "set"
                | "released"
                | "rarity"
                | "color"
                | "usd"
                | "tix"
                | "eur"
                | "cmc"
                | "power"
                | "toughness"
                | "edhrec"
                | "artist"
                | undefined;
              dir?: "auto" | "asc" | "desc" | undefined;
              include_extras?: boolean | undefined;
              include_multilingual?: boolean | undefined;
              include_variations?: boolean | undefined;
            }
          | undefined,
      ): Promise<MagicArray<Scry.Card, never>> {
        throw new Error("Function not implemented.");
      },
    };
  }
}
