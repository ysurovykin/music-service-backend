import { MostSongGuesserStatDataType } from "./songGuesserStats.model";

export default class SongGuesserStatsDto {
    totalGames: number;
    bestScore: number;
    bestGameId: string;
    timeSpentInGuesserInSeconds: number;
    correctGuesses: number;
    closeGuesses: number;
    incorrectGuesses: number;
    skippedGuesses: number;
    mostSkippedGuesser: MostSongGuesserStatDataType;
    mostCloseGuesser: MostSongGuesserStatDataType;
    mostIncorrectGuesser: MostSongGuesserStatDataType;
    mostCorrectGuesser: MostSongGuesserStatDataType;

    constructor(model: any) {
        this.totalGames = model.totalGames;
        this.bestScore = model.bestScore;
        this.bestGameId = model.bestGameId;
        this.timeSpentInGuesserInSeconds = model.timeSpentInGuesserInSeconds;
        this.correctGuesses = model.correctGuesses;
        this.closeGuesses = model.closeGuesses;
        this.incorrectGuesses = model.incorrectGuesses;
        this.skippedGuesses = model.skippedGuesses;
        this.mostSkippedGuesser = model.mostSkippedGuesser;
        this.mostCloseGuesser = model.mostCloseGuesser;
        this.mostIncorrectGuesser = model.mostIncorrectGuesser;
        this.mostCorrectGuesser = model.mostCorrectGuesser;
    }
}