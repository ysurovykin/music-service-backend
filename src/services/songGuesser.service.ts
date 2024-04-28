import ListenerModel from '../models/listener.model';
import SongModel, { SongRecordType } from '../models/song.model';
import { ForbiddenError, NotFoundError } from '../errors/api-errors';
import randomstring from 'randomstring';
import moment from 'moment';
import SongGuesserModel, {
    CheckAnswerResponseDataType,
    CurrentGuesserDataType,
    FormatedGuessDataType,
    GameOverDataType,
    SongGuesserSortDataType,
    SkipResponseDataType,
    SongGuesserAnswerRequestDataType,
    SongGuesserDifficultyEnum,
    SongGuesserFilterDataType,
    SongGuesserInfoResponseDataType,
    SongGuesserRecordType,
    SongGuesserSortTypeEnum,
    FinishedSongGuesserFullResponseDataType,
    SongGuesserAnswersFullDataType,
    FinishedSongGuesserInfoResponseDataType,
    GetFinishedSongGuessersResponseDataType
} from '../models/songGuesser.model';
import PlaylistModel from '../models/playlist.model';
import FollowedArtistsModel from '../models/followedArtists.model';
import LikedAlbumsModel from '../models/likedAlbums.model';
import ArtistModel from '../models/artist.model';
import { songGuesserDifficultiesInSeconds } from '../../config';
import FuzzySet from 'fuzzyset';
import SongGuesserStatsModel, { SongGuesserStatsDataType } from '../models/songGuesserStats.model';
import SongGuesserStatsDto from '../dtos/songGuesserStats.dto';
import _ from 'lodash'
import SongGuesserGuessesRecordModel from '../models/songGuesserGuessesRecord.model';

class SongGuesserService {

    async countAvailableSongs(listenerId: string, filter: SongGuesserFilterDataType): Promise<number> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        let songIds = [];
        let artistIds = [];
        let albumIds = [];
        if (filter.playlists) {
            const playlistIds = filter.playlists.map(playlist => playlist.id);
            const playlists = await PlaylistModel.find({ _id: { $in: playlistIds } }, { songIds: 1 }).lean();
            const songs = playlists.reduce((acc, playlist) => acc.concat(playlist.songIds), []);
            songIds = songs.map(song => song.id);
        }

        if (typeof filter.fromFollowedArtists === 'string' ? filter.fromFollowedArtists === 'true' : filter.fromFollowedArtists) {
            const followedArtists = await FollowedArtistsModel.find({ listenerId: listenerId }, { artistId: 1 }).lean();
            artistIds = followedArtists.map(artist => artist.artistId)
        } else if (filter.artist) {
            artistIds = [filter.artist.id];
        }

        if (typeof filter.fromLikedAlbums === 'string' ? filter.fromLikedAlbums === 'true' : filter.fromLikedAlbums) {
            const likedAlbums = await LikedAlbumsModel.find({ listenerId: listenerId }, { albumId: 1 }).lean();
            albumIds = likedAlbums.map(album => album.albumId);
        } else if (filter.album) {
            albumIds = [filter.album.id];
        }

        const songCount = await SongModel.count({
            $and: [
                songIds.length ? { _id: { $in: songIds } } : {},
                filter.languages?.length ? { language: { $in: filter.languages } } : {},
                filter.genres?.length ? { genres: { $in: filter.genres } } : {},
                artistIds.length ? { artistId: { $in: artistIds } } : {},
                albumIds.length ? { albumId: { $in: albumIds } } : {},
                {
                    $or: [
                        { coArtistIds: { $exists: false } },
                        { coArtistIds: { $size: 0 } }
                    ]
                }
            ]
        });

        return songCount;
    }

    async startSongGuesser(listenerId: string, filter: SongGuesserFilterDataType,
        difficulty: SongGuesserDifficultyEnum): Promise<SongGuesserInfoResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }

        const newSongGuesser = await this._generateNewSongGuesser(listenerId, filter, difficulty);

        const songGuesserId = randomstring.generate(16);
        await SongGuesserModel.create({
            _id: songGuesserId,
            listenerId: listenerId,
            difficulty: difficulty,
            filter: filter,
            mistakes: 0,
            answers: [],
            currentAttempt: 1,
            attemptStartedAt: new Date(),
            currentGuesser: {
                artistName: newSongGuesser.artistName,
                artistId: newSongGuesser.artistId,
                albumId: newSongGuesser.albumId,
                songName: newSongGuesser.songName,
                songId: newSongGuesser.songId,
                songUrl: newSongGuesser.songUrl,
                startTime: newSongGuesser.startTime
            }
        });

        return {
            songGuesserId: songGuesserId,
            songUrl: newSongGuesser.songUrl,
            startTime: newSongGuesser.startTime
        };
    }

    async checkAnswer(listenerId: string, songGuesserId: string, answer: SongGuesserAnswerRequestDataType): Promise<CheckAnswerResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const songGuesser = await SongGuesserModel.findOne({ _id: songGuesserId }).lean();
        if (!songGuesser) {
            throw new NotFoundError(`Song guesser with id ${songGuesserId} not found`);
        }
        if (songGuesser.mistakes >= 3 || songGuesser.finished) {
            throw new ForbiddenError('This Guesser session is already finished');
        }

        const songNameAnswer = answer.songName.trim();
        const artistNameAnswer = answer.artistName.trim();

        const isSongNameCorrect = songNameAnswer.toLowerCase() === songGuesser.currentGuesser.songName.toLowerCase();
        const isArtistNameCorrect = artistNameAnswer.toLowerCase() === songGuesser.currentGuesser.artistName.toLowerCase();

        if (isSongNameCorrect && isArtistNameCorrect) {
            const songIdsToExclude = [songGuesser.currentGuesser.songId, ...songGuesser.answers?.map(answer => answer.song.id)];
            let newSongGuesser: CurrentGuesserDataType;
            let gameOver: boolean;
            try {
                newSongGuesser = await this._generateNewSongGuesser(listenerId, songGuesser.filter,
                    songGuesser.difficulty as SongGuesserDifficultyEnum, songIdsToExclude);
            } catch (error) {
                if (error instanceof NotFoundError) {
                    gameOver = true;
                } else {
                    throw error;
                }
            }
            if (gameOver) {
                const gameOverInfo = this._getGameOverInfo({ ...songGuesser, difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum });
                const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
                const currentAttemptTimeSpentInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
                const spentTimeInSeconds = allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds;
                let newAttempts = _.cloneDeep(songGuesser.attempts);
                newAttempts.push({
                    attempt: songGuesser.currentAttempt,
                    artistNameGuess: artistNameAnswer,
                    songNameGuess: songNameAnswer,
                    formatedArtistNameGuess: [],
                    formatedSongNameGuess: [],
                    spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                    answered: true,
                    isCloseAnswer: false,
                    skipped: false,
                });
                await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                    $set: {
                        finished: true,
                        finishedAt: new Date(),
                        timeSpentInSeconds: spentTimeInSeconds + gameOverInfo.timeSpentInSeconds,
                        skippedAnswers: gameOverInfo.skippedAnswers,
                        closeAnswers: gameOverInfo.closeAnswers,
                        correctAnswers: gameOverInfo.correctAnswers,
                        attempts: []
                    },
                    $push: {
                        answers: {
                            artist: {
                                name: songGuesser.currentGuesser.artistName,
                                id: songGuesser.currentGuesser.artistId
                            },
                            song: {
                                name: songGuesser.currentGuesser.songName,
                                id: songGuesser.currentGuesser.songId
                            },
                            albumId: songGuesser.currentGuesser.albumId,
                            attemptsCount: songGuesser.currentAttempt,
                            attempts: newAttempts,
                            spentTimeInSeconds: spentTimeInSeconds,
                            answered: true,
                            skipped: false,
                            isCloseAnswer: songGuesser.isCloseAnswer
                        }
                    }
                });
                return {
                    isCorrect: true,
                    gameOver: gameOver,
                    gameOverInfo: { ...gameOverInfo, timeSpentInSeconds: spentTimeInSeconds + gameOverInfo.timeSpentInSeconds }
                };
            } else {
                const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
                const spentTimeInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
                let newAttempts = _.cloneDeep(songGuesser.attempts);
                newAttempts.push({
                    attempt: songGuesser.currentAttempt,
                    artistNameGuess: artistNameAnswer,
                    songNameGuess: songNameAnswer,
                    formatedArtistNameGuess: [],
                    formatedSongNameGuess: [],
                    spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                    answered: true,
                    isCloseAnswer: false,
                    skipped: false,
                });
                await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                    $set: {
                        currentAttempt: 1,
                        isCloseAnswer: false,
                        wasIncorrectAnswer: false,
                        attempts: [],
                        attemptStartedAt: new Date(),
                        currentGuesser: {
                            artistName: newSongGuesser.artistName,
                            artistId: newSongGuesser.artistId,
                            songName: newSongGuesser.songName,
                            songId: newSongGuesser.songId,
                            songUrl: newSongGuesser.songUrl,
                            startTime: newSongGuesser.startTime
                        },
                    },
                    $push: {
                        answers: {
                            artist: {
                                name: songGuesser.currentGuesser.artistName,
                                id: songGuesser.currentGuesser.artistId
                            },
                            song: {
                                name: songGuesser.currentGuesser.songName,
                                id: songGuesser.currentGuesser.songId
                            },
                            albumId: songGuesser.currentGuesser.albumId,
                            attemptsCount: songGuesser.currentAttempt,
                            attempts: newAttempts,
                            spentTimeInSeconds: allAttemptsTimeSpentInSeconds + spentTimeInSeconds,
                            answered: true,
                            skipped: false,
                            isCloseAnswer: songGuesser.isCloseAnswer
                        }
                    }
                });
                return {
                    isCorrect: true,
                    songUrl: newSongGuesser.songUrl,
                    startTime: newSongGuesser.startTime
                };
            }
        } else {
            let isSongNameClose: boolean;
            let formatedSongNameGuess: Array<FormatedGuessDataType>;
            if (!isSongNameCorrect) {
                const songFuzzySet = FuzzySet([songGuesser.currentGuesser.songName]);
                const isSongAnswerClose = songFuzzySet.get(songNameAnswer);
                isSongNameClose = isSongAnswerClose?.[0][0] > 0.6;
                if (isSongNameClose) {
                    formatedSongNameGuess = this._highlightCorrectParts(songGuesser.currentGuesser.songName, songNameAnswer)
                }
            }

            let isArtistNameClose: boolean;
            let formatedArtistNameGuess: Array<FormatedGuessDataType>;
            if (!isArtistNameCorrect) {
                const artistFuzzySet = FuzzySet([songGuesser.currentGuesser.artistName]);
                const isArtistAnswerClose = artistFuzzySet.get(artistNameAnswer);
                isArtistNameClose = isArtistAnswerClose?.[0][0] > 0.6;
                if (isArtistNameClose) {
                    formatedArtistNameGuess = this._highlightCorrectParts(songGuesser.currentGuesser.artistName, artistNameAnswer)
                }
            }
            const isClose = isSongNameClose || isArtistNameClose;
            const newMistakes = (!songGuesser.isCloseAnswer && isClose) ? songGuesser.mistakes : ++songGuesser.mistakes;
            const gameOver = newMistakes >= 3;
            let newAttempts = _.cloneDeep(songGuesser.attempts);
            newAttempts.push({
                attempt: songGuesser.currentAttempt,
                artistNameGuess: artistNameAnswer,
                songNameGuess: songNameAnswer,
                formatedArtistNameGuess: formatedArtistNameGuess,
                formatedSongNameGuess: formatedSongNameGuess,
                spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                answered: false,
                isCloseAnswer: isClose,
                skipped: false,
            });

            await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                $set: {
                    currentAttempt: gameOver ? songGuesser.currentAttempt : ++songGuesser.currentAttempt,
                    attemptStartedAt: new Date(),
                    isCloseAnswer: isClose,
                    wasIncorrectAnswer: songGuesser.isCloseAnswer || !isClose,
                    mistakes: newMistakes,
                    attempts: newAttempts
                }
            });

            let gameOverInfo: GameOverDataType;
            let artistName: string;
            let songName: string;
            if (gameOver) {
                gameOverInfo = this._getGameOverInfo({ ...songGuesser, mistakes: newMistakes, difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum });
                const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
                const currentAttemptTimeSpentInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
                const spentTimeInSeconds = allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds;
                gameOverInfo.timeSpentInSeconds += spentTimeInSeconds;
                artistName = songGuesser.currentGuesser.artistName;
                songName = songGuesser.currentGuesser.songName;
                await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                    $set: {
                        finished: true,
                        finishedAt: new Date(),
                        timeSpentInSeconds: gameOverInfo.timeSpentInSeconds,
                        skippedAnswers: gameOverInfo.skippedAnswers,
                        closeAnswers: gameOverInfo.closeAnswers,
                        correctAnswers: gameOverInfo.correctAnswers,
                        attempts: []
                    },
                    $push: {
                        answers: {
                            artist: {
                                name: songGuesser.currentGuesser.artistName,
                                id: songGuesser.currentGuesser.artistId
                            },
                            song: {
                                name: songGuesser.currentGuesser.songName,
                                id: songGuesser.currentGuesser.songId
                            },
                            albumId: songGuesser.currentGuesser.albumId,
                            attemptsCount: songGuesser.currentAttempt,
                            attempts: newAttempts,
                            spentTimeInSeconds: allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds,
                            answered: false,
                            skipped: false,
                            isCloseAnswer: songGuesser.isCloseAnswer
                        }
                    }
                });
            }

            return {
                isCorrect: false,
                isClose: isClose,
                mistakes: newMistakes,
                formatedArtistNameGuess: formatedArtistNameGuess,
                formatedSongNameGuess: formatedSongNameGuess,
                gameOver: gameOver,
                gameOverInfo: gameOverInfo,
                artistName: artistName,
                songName: songName,
                isSongNameCorrect: isSongNameCorrect,
                isArtistNameCorrect: isArtistNameCorrect,
            };
        }
    }

    async skipSong(listenerId: string, songGuesserId: string): Promise<SkipResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }
        const songGuesser = await SongGuesserModel.findOne({ _id: songGuesserId }).lean();
        if (!songGuesser) {
            throw new NotFoundError(`Song guesser with id ${songGuesserId} not found`);
        }
        if (songGuesser.mistakes >= 3 || songGuesser.finished) {
            throw new ForbiddenError('This Guesser session is already finished');
        }
        const newMistakes = songGuesser.wasIncorrectAnswer ? songGuesser.mistakes : ++songGuesser.mistakes;

        let gameOver = newMistakes >= 3;
        let gameOverInfo: GameOverDataType;
        let newSongGuesser: CurrentGuesserDataType;
        if (gameOver) {
            gameOverInfo = this._getGameOverInfo({ ...songGuesser, mistakes: newMistakes, difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum });
            const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
            const currentAttemptTimeSpentInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
            const spentTimeInSeconds = allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds;
            let newAttempts = _.cloneDeep(songGuesser.attempts);
            newAttempts.push({
                attempt: songGuesser.currentAttempt,
                artistNameGuess: '',
                songNameGuess: '',
                formatedArtistNameGuess: [],
                formatedSongNameGuess: [],
                spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                answered: false,
                isCloseAnswer: false,
                skipped: true,
            });
            gameOverInfo.timeSpentInSeconds += spentTimeInSeconds;
            await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                $set: {
                    finished: true,
                    mistakes: newMistakes,
                    isCloseAnswer: false,
                    wasIncorrectAnswer: false,
                    attempts: [],
                    finishedAt: new Date(),
                    timeSpentInSeconds: gameOverInfo.timeSpentInSeconds,
                    skippedAnswers: ++gameOverInfo.skippedAnswers,
                    closeAnswers: gameOverInfo.closeAnswers,
                    correctAnswers: gameOverInfo.correctAnswers
                },
                $push: {
                    answers: {
                        artist: {
                            name: songGuesser.currentGuesser.artistName,
                            id: songGuesser.currentGuesser.artistId
                        },
                        song: {
                            name: songGuesser.currentGuesser.songName,
                            id: songGuesser.currentGuesser.songId
                        },
                        albumId: songGuesser.currentGuesser.albumId,
                        attemptsCount: songGuesser.currentAttempt,
                        attempts: newAttempts,
                        spentTimeInSeconds: allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds,
                        answered: false,
                        skipped: true,
                        isCloseAnswer: songGuesser.isCloseAnswer
                    }
                }
            });
        } else {
            const songIdsToExclude = [songGuesser.currentGuesser.songId, ...songGuesser.answers?.map(answer => answer.song.id)];
            try {
                newSongGuesser = await this._generateNewSongGuesser(listenerId, songGuesser.filter,
                    songGuesser.difficulty as SongGuesserDifficultyEnum, songIdsToExclude);
            } catch (error) {
                if (error instanceof NotFoundError) {
                    gameOver = true;
                } else {
                    throw error;
                }
            }
            if (gameOver) {
                gameOverInfo = this._getGameOverInfo({ ...songGuesser, mistakes: newMistakes, difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum });
                const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
                const currentAttemptTimeSpentInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
                const spentTimeInSeconds = allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds;
                let newAttempts = _.cloneDeep(songGuesser.attempts);
                newAttempts.push({
                    attempt: songGuesser.currentAttempt,
                    artistNameGuess: '',
                    songNameGuess: '',
                    formatedArtistNameGuess: [],
                    formatedSongNameGuess: [],
                    spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                    answered: false,
                    isCloseAnswer: false,
                    skipped: true,
                });
                gameOverInfo.timeSpentInSeconds += spentTimeInSeconds;
                await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                    $set: {
                        finished: true,
                        mistakes: newMistakes,
                        attempts: [],
                        attemptStartedAt: new Date(),
                        finishedAt: new Date(),
                        timeSpentInSeconds: gameOverInfo.timeSpentInSeconds,
                        skippedAnswers: gameOverInfo.skippedAnswers,
                        closeAnswers: gameOverInfo.closeAnswers,
                        correctAnswers: gameOverInfo.correctAnswers
                    },
                    $push: {
                        answers: {
                            artist: {
                                name: songGuesser.currentGuesser.artistName,
                                id: songGuesser.currentGuesser.artistId
                            },
                            song: {
                                name: songGuesser.currentGuesser.songName,
                                id: songGuesser.currentGuesser.songId
                            },
                            albumId: songGuesser.currentGuesser.albumId,
                            attemptsCount: songGuesser.currentAttempt,
                            attempts: newAttempts,
                            spentTimeInSeconds: allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds,
                            answered: false,
                            skipped: true,
                            isCloseAnswer: songGuesser.isCloseAnswer
                        }
                    }
                });
            } else {
                const allAttemptsTimeSpentInSeconds = songGuesser.attempts.reduce((accumulator, attempt) => accumulator + attempt.spentTimeInSeconds, 0);
                const currentAttemptTimeSpentInSeconds = moment().diff(songGuesser.attemptStartedAt, 'seconds', true);
                const spentTimeInSeconds = allAttemptsTimeSpentInSeconds + currentAttemptTimeSpentInSeconds;
                let newAttempts = _.cloneDeep(songGuesser.attempts);
                newAttempts.push({
                    attempt: songGuesser.currentAttempt,
                    artistNameGuess: '',
                    songNameGuess: '',
                    formatedArtistNameGuess: [],
                    formatedSongNameGuess: [],
                    spentTimeInSeconds: moment().diff(songGuesser.attemptStartedAt, 'seconds', true),
                    answered: false,
                    isCloseAnswer: false,
                    skipped: true,
                });
                await SongGuesserModel.updateOne({ _id: songGuesserId }, {
                    $set: {
                        currentAttempt: 1,
                        attemptStartedAt: new Date(),
                        attempts: [],
                        isCloseAnswer: false,
                        mistakes: newMistakes,
                        currentGuesser: {
                            artistName: newSongGuesser.artistName,
                            artistId: newSongGuesser.artistId,
                            songName: newSongGuesser.songName,
                            songId: newSongGuesser.songId,
                            songUrl: newSongGuesser.songUrl,
                            startTime: newSongGuesser.startTime
                        },
                    },
                    $push: {
                        answers: {
                            artist: {
                                name: songGuesser.currentGuesser.artistName,
                                id: songGuesser.currentGuesser.artistId
                            },
                            song: {
                                name: songGuesser.currentGuesser.songName,
                                id: songGuesser.currentGuesser.songId
                            },
                            albumId: songGuesser.currentGuesser.albumId,
                            attemptsCount: songGuesser.currentAttempt,
                            attempts: newAttempts,
                            spentTimeInSeconds: spentTimeInSeconds,
                            answered: false,
                            skipped: true,
                            isCloseAnswer: songGuesser.isCloseAnswer
                        }
                    }
                });
            }
        }

        return {
            mistakes: newMistakes,
            artistName: songGuesser.currentGuesser.artistName,
            songName: songGuesser.currentGuesser.songName,
            songUrl: newSongGuesser?.songUrl,
            startTime: newSongGuesser?.startTime,
            gameOver: gameOver,
            gameOverInfo: gameOverInfo
        };
    }

    async getFinishedSongGuesserStats(listenerId: string): Promise<SongGuesserStatsDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }

        const songGuesserStats = await SongGuesserStatsModel.findOne({ listenerId: listenerId }).lean();
        if (!songGuesserStats) {
            return;
        }

        const songGuesserStatsDto = new SongGuesserStatsDto(songGuesserStats);

        return {
            ...songGuesserStatsDto,

        };
    }

    async getFinishedSongGuesserById(songGuesserId: string): Promise<FinishedSongGuesserFullResponseDataType> {
        const songGuesser = await SongGuesserModel.findOne({ _id: songGuesserId, finished: true }).lean();
        if (!songGuesser) {
            throw new NotFoundError(`Song Guesser with id ${songGuesserId} not found`);
        }

        const answers: Array<SongGuesserAnswersFullDataType> = songGuesser.answers.map(answer => {
            return {
                artist: answer.artist,
                song: answer.song,
                albumId: answer.albumId,
                attemptsCount: answer.attemptsCount,
                spentTimeInSeconds: answer.spentTimeInSeconds,
                answered: answer.answered,
                skipped: answer.skipped,
                isCloseAnswer: answer.isCloseAnswer,
                attempts: answer.attempts as any //TODO fix
            }
        })

        return {
            correctAnswers: songGuesser.correctAnswers,
            difficulty: songGuesser.difficulty as SongGuesserDifficultyEnum,
            filter: songGuesser.filter,
            finishedAt: songGuesser.finishedAt,
            mistakes: songGuesser.mistakes,
            skippedAnswers: songGuesser.skippedAnswers,
            closeAnswers: songGuesser.closeAnswers,
            timeSpentInSeconds: songGuesser.timeSpentInSeconds,
            answers: answers
        };
    }

    async getFinishedSongGuessers(listenerId: string, offset: number = 0, limit: number = 10, difficulties: Array<SongGuesserDifficultyEnum>,
        filter: SongGuesserFilterDataType, sort: SongGuesserSortDataType): Promise<GetFinishedSongGuessersResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`User with id ${listenerId} not found`);
        }

        const matchPipeline = {
            listenerId: listenerId,
            finished: true,
            ...(difficulties?.length ? { difficulty: { $in: (difficulties || []) } } : {})
        };
        const filterPipeline = {};

        if (typeof filter?.fromFollowedArtists !== 'undefined') {
            const fromFollowedArtists = typeof filter?.fromFollowedArtists === 'string' ? filter?.fromFollowedArtists === 'true' : filter?.fromFollowedArtists;
            filterPipeline['filter.fromFollowedArtists'] = fromFollowedArtists;
        }

        if (typeof filter?.fromLikedAlbums !== 'undefined') {
            const fromLikedAlbums = typeof filter?.fromLikedAlbums === 'string' ? filter?.fromLikedAlbums === 'true' : filter?.fromLikedAlbums;
            filterPipeline['filter.fromLikedAlbums'] = fromLikedAlbums;
        }

        if (filter?.languages?.length) {
            filterPipeline['filter.languages'] = { $in: filter.languages };
        }

        if (filter?.genres?.length) {
            filterPipeline['filter.genres'] = { $in: filter.genres };
        }

        if (filter?.playlists?.length) {
            const playlistIds = filter.playlists.map((playlist) => playlist.id);
            filterPipeline['filter.playlists.id'] = { $in: playlistIds };
        }

        const sortPipeline: { [key: string]: 1 | -1 } = {};

        if (sort?.answers && (sort.answers !== SongGuesserSortTypeEnum.NEUTRAL)) {
            sortPipeline.correctAnswers = sort.answers === SongGuesserSortTypeEnum.ASC ? 1 : -1;
        } else if (sort?.timeSpent && (sort.timeSpent !== SongGuesserSortTypeEnum.NEUTRAL)) {
            sortPipeline.timeSpentInSeconds = sort.timeSpent === SongGuesserSortTypeEnum.ASC ? 1 : -1;
        } else {
            sortPipeline.finishedAt = sort.finishedAt === SongGuesserSortTypeEnum.ASC ? 1 : -1
        }

        const finishedSongGuessers: Array<FinishedSongGuesserInfoResponseDataType> = await SongGuesserModel.aggregate([
            { $match: { ...matchPipeline, ...filterPipeline } },
            { $sort: sortPipeline },
            { $skip: (+offset * +limit) },
            { $limit: +limit },
            {
                $project: {
                    songGuesserId: '$_id',
                    filter: 1,
                    difficulty: 1,
                    mistakes: 1,
                    finishedAt: 1,
                    finished: 1,
                    timeSpentInSeconds: 1,
                    correctAnswers: 1,
                    skippedAnswers: 1,
                    closeAnswers: 1,
                }
            }
        ]);

        return {
            finishedSongGuessers: finishedSongGuessers,
            isMoreFinishedSongGuessersForLoading: finishedSongGuessers.length === +limit
        };
    }

    async _generateNewSongGuesser(listenerId: string, filter: SongGuesserFilterDataType,
        difficulty: SongGuesserDifficultyEnum, songIdsToExclude: Array<string> = []): Promise<CurrentGuesserDataType> {
        let songIds = [];
        let artistIds = [];
        let albumIds = [];
        if (filter.playlists) {
            const playlistIds = filter.playlists.map(playlist => playlist.id);
            const playlists = await PlaylistModel.find({ _id: { $in: playlistIds } }, { songIds: 1 }).lean();
            const songs = playlists.reduce((acc, playlist) => acc.concat(playlist.songIds), []);
            songIds = songs.map(song => song.id);
        }

        if (typeof filter.fromFollowedArtists === 'string' ? filter.fromFollowedArtists === 'true' : filter.fromFollowedArtists) {
            const followedArtists = await FollowedArtistsModel.find({ listenerId: listenerId }, { artistId: 1 }).lean();
            artistIds = followedArtists.map(artist => artist.artistId)
        } else if (filter.artist) {
            artistIds = [filter.artist.id];
        }

        if (typeof filter.fromLikedAlbums === 'string' ? filter.fromLikedAlbums === 'true' : filter.fromLikedAlbums) {
            const likedAlbums = await LikedAlbumsModel.find({ listenerId: listenerId }, { albumId: 1 }).lean();
            albumIds = likedAlbums.map(album => album.albumId);
        } else if (filter.album) {
            albumIds = [filter.album.id];
        }

        const song = await SongModel.aggregate([
            {
                $match: {
                    ...(songIds.length ? { _id: { $in: songIds, $nin: songIdsToExclude } } : { _id: { $nin: songIdsToExclude } }),
                    ...(filter.languages.length ? { language: { $in: filter.languages } } : {}),
                    ...(filter.genres.length ? { genres: { $in: filter.genres } } : {}),
                    ...(artistIds.length ? { artistId: { $in: artistIds } } : {}),
                    ...(albumIds.length ? { albumId: { $in: albumIds } } : {}),
                    $or: [
                        { coArtistIds: { $exists: false } },
                        { coArtistIds: { $size: 0 } }
                    ]
                }
            },
            {
                $project: {
                    weight: { $rand: {} },
                    songUrl: '$songUrl',
                    artistId: '$artistId',
                    albumId: '$albumId',
                    songId: '$_id',
                    songName: '$name',
                    duration: '$duration'
                }
            },
            { $sort: { weight: -1 } },
            { $limit: 1 }
        ]);

        let artistName: string;
        if (song?.[0]) {
            const artist = await ArtistModel.findOne({ _id: song[0].artistId }, { name: 1 }).lean();
            artistName = artist.name;
        } else {
            throw new NotFoundError('Song for provided filters not found');
        }

        const maxStartTime = +song[0].duration - +songGuesserDifficultiesInSeconds[difficulty];
        const startTime = Math.random() * maxStartTime;

        return {
            artistName: artistName,
            artistId: song[0].artistId,
            songName: song[0].songName,
            songId: song[0].songId,
            songUrl: song[0].songUrl,
            albumId: song[0].albumId,
            startTime: startTime
        }
    }

    _highlightCorrectParts(correctAnswer: string, guessAnswer: string): Array<FormatedGuessDataType> {
        const result: Array<FormatedGuessDataType> = [];

        const correctAnswerFormated = correctAnswer.trim().toLowerCase();
        const guessAnswerFormated = guessAnswer.trim().toLowerCase();

        for (let i = 0; i < guessAnswer.length; i++) {
            let type: "correct" | "missplaced" | "incorrect";

            if (guessAnswerFormated[i] === correctAnswerFormated[i]) {
                type = "correct";
            } else {
                const leftCorrectSymbol = correctAnswerFormated[i - 1] || '';
                const rightCorrectSymbol = correctAnswerFormated[i + 1] || '';
                const missplacedLeftSymbol = (guessAnswerFormated[i] === leftCorrectSymbol) && (guessAnswerFormated[i - 1] !== leftCorrectSymbol);
                const missplacedRightSymbol = (guessAnswerFormated[i] === rightCorrectSymbol) && (guessAnswerFormated[i + 1] !== rightCorrectSymbol);
                type = (missplacedLeftSymbol || missplacedRightSymbol) ? "missplaced" : "incorrect";
            }

            result.push({ symbol: guessAnswer[i], type });
        }

        return result;
    }

    _getGameOverInfo(songGuesser: SongGuesserRecordType) {
        let correctAnswers: number = 0;
        let skippedAnswers: number = 0;
        let closeAnswers: number = 0;
        for (const answer of songGuesser.answers) {
            if (answer.answered) {
                correctAnswers += 1;
            }
            if (answer.skipped) {
                skippedAnswers += 1;
            }
            if (answer.isCloseAnswer) {
                closeAnswers += 1;
            }
        }
        const timeSpentInSeconds = songGuesser.answers.reduce((accumulator, answer) => accumulator + answer.spentTimeInSeconds, 0);
        const gameOverInfo = {
            correctAnswers: correctAnswers,
            incorrectAnswers: songGuesser.mistakes,
            closeAnswers: closeAnswers,
            skippedAnswers: skippedAnswers,
            timeSpentInSeconds: timeSpentInSeconds,
        }

        return gameOverInfo;
    }

}

const songGuesserService = new SongGuesserService();
export default songGuesserService;