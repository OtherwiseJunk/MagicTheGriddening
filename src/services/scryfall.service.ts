import * as Scry from "scryfall-sdk";
import { colorToColorCode, rarityToRarityCode } from "@/constants/scryfallConstants";
import { GameConstraint } from "@/models/UI/gameConstraint";

export default class ScryfallService{

static queryCountMap = new Map();

static async getFirstPageCardCount(query: string): Promise<number>{
    if(this.queryCountMap.has(query)){
        return this.queryCountMap.get(query);
    }    
    const queryCardCount = (await Scry.Cards.search(query, 1).cancelAfterPage().waitForAll()).length;
    this.queryCountMap.set(query, queryCardCount);
    return queryCardCount
}

static async getSetConstraints(): Promise<GameConstraint[]>{
    const setConstraints: GameConstraint[] = [];
  
    (await Scry.Sets.all()).forEach((set) => {
      if (["core", "expansion"].includes(set.set_type)) {
        let santizedName = this.santizeSetName(set.name);
        if(santizedName){
          setConstraints.push(
            new GameConstraint(`${santizedName} - ${set.code}`, 4)
          );
        }        
      }
    });

    return setConstraints;
}

private static santizeSetName(setName:string): string{
  return setName.replace("Foreign Black Border", "")
    .replace("Limited Edition Alpha", "Alpha")
    .replace("Limited Edition Beta", "Beta")
    .replace("Unlimited Edition", "Unlimited")
    .replace("Revised Edition", "Revised")
    .replace("Fourth Edition", "4th Edition")
    .replace("Fifth Edition", "5th Edition")
    .replace("Classic Sixth Edition", "6th Edition")
    .replace("Seventh Edition", "7th Edition")
    .replace("Eighth Edition", "8th Edition")
    .replace("Ninth Edition", "9th Edition")
    .replace("Tenth Edition", "10th Edition").trim();
}

static getScryfallQueryForConstraint(constraint: GameConstraint): string {
  switch (constraint.constraintType) {
    case 0:
      return `r:${rarityToRarityCode.get(constraint.displayName)}`;
    case 1:
      return `type:${constraint.displayName}`;
    case 2:
      return `cmc:${parseInt(constraint.displayName.split(" ")[2])}`;
    case 3:
      return `c:${colorToColorCode.get(constraint.displayName)}`;
    case 4:
      return `set:${constraint.displayName.split("-")[1].trim()}`;
    default:
      return ''
  }
}

static getScryfallQueryForColorPair(colorConstraintOne: GameConstraint, colorConstraintTwo: GameConstraint){
  return `c:${colorToColorCode.get(colorConstraintOne.displayName)}${colorToColorCode.get(
    colorConstraintTwo.displayName
  )}`;
}
}