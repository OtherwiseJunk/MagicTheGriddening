export class GameConstraint{
    constructor(
        public displayName: string,
        public constraintType: ConstraintType,
        public imageSrc: string ="",
        public imageAltText: string = ""
    ){}
}

export enum ConstraintType {
    Rarity,
    Type,
    Color,
    Set,
}