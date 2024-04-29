import { Schema, model } from 'mongoose';

export type MostSongGuesserStatDataType = {
  guesserSongName: string,
  guesserArtistName: string,
  guesses: number,
}

export type SongGuesserStatsDataType = {
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
}

const mostSongGuesserStatSchema = new Schema({
  guesserSongName: { type: String, required: true },
  guesserArtistName: { type: String, required: true },
  guesses: { type: Number, required: true },
});

const songGuesserStatsSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  totalGames: { type: Number, required: true, default: 0 },
  bestScore: { type: Number, required: true, default: 0 },
  bestGameId: { type: String, required: false },
  timeSpentInGuesserInSeconds: { type: Number, required: true, default: 0 },
  correctGuesses: { type: Number, required: true, default: 0 },
  closeGuesses: { type: Number, required: true, default: 0 },
  incorrectGuesses: { type: Number, required: true, default: 0 },
  skippedGuesses: { type: Number, required: true, default: 0 },
  mostSkippedGuesser: mostSongGuesserStatSchema,
  mostCloseGuesser: mostSongGuesserStatSchema,
  mostIncorrectGuesser: mostSongGuesserStatSchema,
  mostCorrectGuesser: mostSongGuesserStatSchema,
});

songGuesserStatsSchema.index({ listenerId: 1 });

const SongGuesserStatsModel = model('SongGuesserStats', songGuesserStatsSchema);

export default SongGuesserStatsModel;
