import { Schema, model } from 'mongoose';

export type SongGuesserInfoResponseDataType = {
  songGuesserId: string;
  songUrl: string;
  startTime: number;
}

export type SongGuesserAnswerRequestDataType = {
  artistName: string;
  songName: string;
}

export type CorrectAnswerResponseDataType = {
  isCorrect: true;
  songUrl?: string;
  startTime?: number;
  gameOver?: boolean;
  gameOverInfo?: GameOverDataType;
}

export type GameOverDataType = {
  timeSpentInSeconds: number;
  correctAnswers: number;
  incorrectAnswers: number;
  closeAnswers: number;
  skippedAnswers: number;
}

export type FormatedGuessType = 'correct' | 'missplaced' | 'incorrect';

export type FormatedGuessDataType = {
  symbol: string;
  type: FormatedGuessType;
}

export type WrongAnswerResponseDataType = {
  isCorrect: false;
  isClose: boolean;
  mistakes: number;
  formatedSongNameGuess: Array<FormatedGuessDataType>;
  formatedArtistNameGuess: Array<FormatedGuessDataType>;
  gameOver: boolean;
  gameOverInfo: GameOverDataType;
  isSongNameCorrect?: boolean;
  isArtistNameCorrect?: boolean;
  artistName?: string;
  songName?: string;
}

export type CheckAnswerResponseDataType = CorrectAnswerResponseDataType | WrongAnswerResponseDataType;

export type SkipResponseDataType = {
  artistName: string;
  songName: string;
  mistakes: number;
  songUrl?: string;
  startTime?: number;
  gameOver: boolean;
  gameOverInfo: GameOverDataType;
}

export type SongGuesserRecordType = {
  _id: string;
  listenerId: string;
  filter?: SongGuesserFilterDataType;
  difficulty: SongGuesserDifficultyEnum;
  currentGuesser?: CurrentGuesserDataType;
  mistakes: number;
  finished?: boolean;
  finishedAt?: Date;
  attemptStartedAt?: Date;
  currentAttempt?: number;
  timeSpentInSeconds?: number;
  wasIncorrectAnswer?: boolean;
  isCloseAnswer?: boolean;
  correctAnswers: number;
  answers?: Array<GuesserAnswersDataType>;
}

export enum SongGuesserDifficultyEnum {
  'NEW_TO_MUSIC' = 'NEW_TO_MUSIC',
  'FREQUENT_LISTENER' = 'FREQUENT_LISTENER',
  'TRUE_FAN' = 'TRUE_FAN',
}

export type SongGuesserFilterContentDataType = {
  name: string;
  id: string;
};

export type SongGuesserFilterDataType = {
  languages?: Array<string>;
  genres?: Array<string>;
  playlists?: Array<SongGuesserFilterContentDataType>;
  album?: SongGuesserFilterContentDataType;
  artist?: SongGuesserFilterContentDataType;
  fromLikedAlbums?: boolean | string;
  fromFollowedArtists?: boolean | string;
};

export type CurrentGuesserDataType = {
  artistName: string;
  artistId: string;
  songName: string;
  songId: string;
  albumId: string;
  songUrl: string;
  startTime: number;
};

export type GuesserAnswersDataType = {
  artist?: SongGuesserFilterContentDataType,
  song?: SongGuesserFilterContentDataType,
  albumId: string;
  attemptsCount: number;
  spentTimeInSeconds: number;
  answered?: boolean;
  skipped?: boolean;
  isCloseAnswer?: boolean;
};

export enum SongGuesserSortTypeEnum {
  'ASC' = 'ASC',
  'DESC' = 'DESC',
  'NEUTRAL' = 'NEUTRAL',
}

export type SongGuesserSortDataType = {
  timeSpent: SongGuesserSortTypeEnum;
  answers: SongGuesserSortTypeEnum;
  finishedAt: SongGuesserSortTypeEnum;
};

export type SongGuesserAnswersFullDataType = {
  artist: SongGuesserFilterContentDataType;
  song: SongGuesserFilterContentDataType;
  albumId: string;
  attemptsCount: number;
  attempts: Array<GuesserAttemptDataType>,
  spentTimeInSeconds: number;
  answered?: boolean;
  skipped?: boolean;
  isCloseAnswer?: boolean;
}

export type FinishedSongGuesserInfoResponseDataType = {
  songGuesserId: string;
  filter: SongGuesserFilterDataType;
  difficulty: SongGuesserDifficultyEnum;
  finishedAt: Date;
  mistakes: number;
  timeSpentInSeconds: number;
  correctAnswers: number;
  skippedAnswers: number;
  closeAnswers: number;
}

export type FinishedSongGuesserFullResponseDataType = {
  filter: SongGuesserFilterDataType;
  difficulty: SongGuesserDifficultyEnum;
  finishedAt: Date;
  mistakes: number;
  timeSpentInSeconds: number;
  correctAnswers: number;
  skippedAnswers: number;
  closeAnswers: number;
  answers: Array<SongGuesserAnswersFullDataType>;
}

export type GetFinishedSongGuessersResponseDataType = {
  finishedSongGuessers: Array<FinishedSongGuesserInfoResponseDataType>;
  isMoreFinishedSongGuessersForLoading: boolean;
}

export type GuesserAttemptDataType = {
  attempt: number
  artistNameGuess: string
  songNameGuess: string
  formatedArtistNameGuess: Array<FormatedGuessDataType>,
  formatedSongNameGuess: Array<FormatedGuessDataType>,
  spentTimeInSeconds: number,
  answered?: boolean,
  skipped?: boolean,
  isCloseAnswer?: boolean,
}

const songGuesserFilterContentSchema = new Schema({
  name: { type: String, required: true },
  id: { type: String, required: true }
});

const songGuesserFilterSchema = new Schema({
  languages: [String],
  genres: [String],
  playlists: [songGuesserFilterContentSchema],
  album: songGuesserFilterContentSchema,
  artist: songGuesserFilterContentSchema,
  fromLikedAlbums: { type: Boolean, required: false },
  fromFollowedArtists: { type: Boolean, required: false },
});

const currentGuesserSchema = new Schema({
  artistName: { type: String, required: true },
  artistId: { type: String, required: true },
  songName: { type: String, required: true },
  songId: { type: String, required: true },
  albumId: { type: String, required: true },
  songUrl: { type: String, required: true },
  startTime: { type: Number, required: true },
});

const formatedGuessSchema = new Schema({
  symbol: { type: String, required: true },
  type: { type: String, required: true },
});

const guesserAttemptsSchema = new Schema({
  attempt: { type: Number, required: true },
  artistNameGuess: { type: String, required: true },
  songNameGuess: { type: String, required: true },
  formatedArtistNameGuess: [formatedGuessSchema],
  formatedSongNameGuess: [formatedGuessSchema],
  spentTimeInSeconds: { type: Number, required: true },
  answered: { type: Boolean, required: false },
  skipped: { type: Boolean, required: false },
  isCloseAnswer: { type: Boolean, required: false },
});

const guesserAnswersSchema = new Schema({
  artist: songGuesserFilterContentSchema,
  song: songGuesserFilterContentSchema,
  albumId: { type: String, required: true },
  attemptsCount: { type: Number, required: true },
  attempts: [guesserAttemptsSchema],
  spentTimeInSeconds: { type: Number, required: true },
  answered: { type: Boolean, required: false },
  skipped: { type: Boolean, required: false },
  isCloseAnswer: { type: Boolean, required: false },
});

const songGuesserSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  filter: songGuesserFilterSchema,
  // type: SongGuesserDifficultyEnum
  difficulty: { type: String, required: true },
  currentGuesser: currentGuesserSchema,
  mistakes: { type: Number, required: true, default: 0 },
  finished: { type: Boolean, required: false },
  finishedAt: { type: Date, required: false },
  currentAttempt: { type: Number, required: false },
  attemptStartedAt: { type: Date, required: false },
  attempts: [guesserAttemptsSchema],
  isCloseAnswer: { type: Boolean, required: false },
  wasIncorrectAnswer: { type: Boolean, required: false },
  isIncludedInStats: { type: Boolean, required: false },
  timeSpentInSeconds: { type: Number, required: false },
  skippedAnswers: { type: Number, required: true, default: 0 },
  closeAnswers: { type: Number, required: true, default: 0 },
  correctAnswers: { type: Number, required: true, default: 0 },
  answers: [guesserAnswersSchema],
});

songGuesserSchema.index({ listenerId: 1, finished: 1, isIncludedInStats: 1 });

const SongGuesserModel = model('SongGuesser', songGuesserSchema);

export default SongGuesserModel;
