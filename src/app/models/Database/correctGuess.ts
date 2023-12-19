export class CorrectGuess {
    constructor(public id: number, public playerRecordId: number, public gameId: number, public correctGuess: string, public squareIndex: number, public imageSource: string) { }

    toUIObject() {
        return {
            cardName: this.correctGuess,
            imageUrl: this.imageSource,
            squareIndex: this.squareIndex
        }
    }
}
