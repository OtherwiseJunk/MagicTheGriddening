-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "day" TEXT NOT NULL,
    "constraintsJSON" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRecord" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "lifePoints" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,

    CONSTRAINT "PlayerRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectGuesses" (
    "id" SERIAL NOT NULL,
    "playerRecordId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "correctGuess" TEXT NOT NULL,
    "squareIndex" INTEGER NOT NULL,
    "imageSource" TEXT NOT NULL,

    CONSTRAINT "CorrectGuesses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerRecord" ADD CONSTRAINT "PlayerRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectGuesses" ADD CONSTRAINT "CorrectGuesses_playerRecordId_fkey" FOREIGN KEY ("playerRecordId") REFERENCES "PlayerRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectGuesses" ADD CONSTRAINT "CorrectGuesses_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
