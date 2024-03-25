import QueueModel, { QueueInfoResponseDataType, GenerateQueueOptionsType, QueueSongInfoResponseDataType, QueueSongType, UpdatedQueueDataType, RepeatSongStatesType, RepeatSongStateEnum } from '../models/queue.model';
import songService from './song.service';
import SongModel, { GetSongsSortingOptionsType, SongInfoResponseDataType, SongRecordType, } from '../models/song.model';
import PlaylistModel from '../models/playlist.model';
import AlbumModel from '../models/album.model';
import randomstring from 'randomstring';
import { NotFoundError } from '../errors/api-errors';

class QueueService {

    async getQueue(listenerId: string, songQueueId: string): Promise<QueueInfoResponseDataType> {
        const queue = await QueueModel.findOne({ _id: listenerId }).lean();
        const allSongs = queue?.queue || [];
        let songsResponse: Array<QueueSongInfoResponseDataType> = [];
        if (allSongs.length) {
            const currentSongIndex = allSongs.findIndex(song => song.songQueueId === songQueueId);
            const startIndex = Math.max(currentSongIndex - 9, 0);
            const endIndex = Math.min(currentSongIndex + 9, allSongs.length - 1);
            const songs = allSongs.slice(startIndex, endIndex + 1);
            songsResponse = await this._formatSongs(listenerId, songs);
        }
        return {
            queue: songsResponse,
            songQueueId: songQueueId,
            isMoreSongsForwardForLoading: true,
            isMoreSongsBehindForLoading: true
        };
    }

    async addSongToQueue(listenerId: string, currentSongQueueId: string, songId: string): Promise<QueueSongInfoResponseDataType> {
        const song = await SongModel.findOne({ _id: songId }).lean();
        if (!song) {
            throw new NotFoundError(`Song with id ${songId} not found`);
        }
        const songFormated: SongInfoResponseDataType = await songService.formatSongData(listenerId, song);
        const songQueueId = randomstring.generate(16);
        const currentQueue = await QueueModel.findOne({ _id: listenerId }).lean();
        const queue = currentQueue.queue;
        const currentSongIndex = queue.findIndex(songInQueue => songInQueue.songQueueId === currentSongQueueId);
        queue.splice(currentSongIndex + 1, 0, { songId, songQueueId });
        await QueueModel.updateOne({ _id: listenerId }, { $set: { queue } });
        return { ...songFormated, songQueueId };
    }

    async removeSongFromQueue(listenerId: string, songQueueId: string): Promise<void> {
        await QueueModel.updateOne({ _id: listenerId }, { $pull: { queue: { songQueueId } } });
    }

    async generateQueue(listenerId: string, songId: string, songQueueId: string, shuffleEnabled: boolean,
        isNewQueue: boolean, extendForward: boolean, options: GenerateQueueOptionsType, onlyLiked: boolean,
        sortingOptions: GetSongsSortingOptionsType, search: string, repeatSongState: RepeatSongStatesType): Promise<QueueInfoResponseDataType> {
        const currentQueue = await QueueModel.findOne({ _id: listenerId }).lean();
        let likedSongIds: Array<string>;
        if (onlyLiked) {
            const likedSongs = await PlaylistModel.findOne({ listenerId: listenerId, tag: 'liked' }).lean();
            likedSongIds = likedSongs.songIds.map(song => song.id);
        }
        let allSongs: Array<QueueSongType>;
        let isMoreSongsForwardForLoading: boolean;
        let isMoreSongsBehindForLoading: boolean;
        let queueSongs: Array<QueueSongType>;
        let songQueueIdToBePlayed: string;
        if (!options && search) {
            const songs = await SongModel.findOne({ _id: songId }, { _id: 1 }).lean();
            allSongs = Array(100).fill(songs).map(song => ({ songId: song._id, songQueueId: randomstring.generate(16) }))
            queueSongs = allSongs.slice(10, 20);
            songQueueIdToBePlayed = queueSongs[0].songQueueId;
            isMoreSongsForwardForLoading = true;
            isMoreSongsBehindForLoading = false;
        } else {
            if (options) {
                options = typeof options === 'object' ? options : JSON.parse(options);
            } else {
                options = currentQueue.lastUsedOptions;
            }
            const playlistId = options.playlistId;
            const albumId = options.albumId;
            const artistId = options.artistId;
            if (isNewQueue) {
                if (playlistId) {
                    const songsAggregate = await PlaylistModel.aggregate([
                        { $match: { _id: playlistId } },
                        { $unwind: '$songIds' },
                        {
                            $lookup: {
                                from: 'songs',
                                localField: 'songIds.id',
                                foreignField: '_id',
                                as: 'matchedSong'
                            }
                        },
                        { $unwind: '$matchedSong' },
                        {
                            $project: {
                                _id: 0,
                                song: {
                                    $mergeObjects: [
                                        '$matchedSong',
                                        { date: '$songIds.date' }
                                    ]
                                }
                            }
                        },
                        { $match: { 'song.date': { $exists: true } } },
                        { $sort: { 'song.date': -1 } }
                    ]);
                    const playlistSongs: Array<SongRecordType> = songsAggregate.map(songAggregate => ({ ...songAggregate.song }));
                    allSongs = playlistSongs.map(song => ({ songId: song._id, songQueueId: randomstring.generate(16) }));
                } else if (albumId) {
                    const album = await AlbumModel.findOne({ _id: albumId }).lean();
                    const allAlbumSongs = await SongModel.find({ _id: { $in: album.songIds } }, { _id: 1 }).lean();
                    const songs = allAlbumSongs.sort((a, b) => album.songIds.indexOf(a._id) - album.songIds.indexOf(b._id));
                    allSongs = songs.map(song => ({ songId: song._id, songQueueId: randomstring.generate(16) }));
                } else if (artistId) {
                    const sortingRequest = songService.getSortingRequest(sortingOptions);
                    const findRequest: any = { artistId: artistId };
                    if (likedSongIds) {
                        findRequest._id = { $in: likedSongIds };
                    }
                    const songs = await SongModel.find(findRequest, { _id: 1 }).sort(sortingRequest).lean();
                    allSongs = songs.map(song => ({ songId: song._id, songQueueId: randomstring.generate(16) }));
                }
            } else {
                allSongs = currentQueue.queue;
            }
            const result = await
                this._getSongIdsForQueue(allSongs, songId, songQueueId, shuffleEnabled, repeatSongState, isNewQueue, extendForward);
            queueSongs = result.songs;
            isMoreSongsForwardForLoading = result.isMoreSongsForwardForLoading;
            isMoreSongsBehindForLoading = result.isMoreSongsBehindForLoading;

            if (isNewQueue && !songQueueId && !songId) {
                songQueueIdToBePlayed = queueSongs[0].songQueueId;
            } else if (isNewQueue && !songQueueId) {
                songQueueIdToBePlayed = queueSongs.find(song => song.songId === songId).songQueueId;
            } else {
                songQueueIdToBePlayed = songQueueId;
            }
        }

        const songsResponse = await this._formatSongs(listenerId, queueSongs);
        if (isNewQueue) {
            await QueueModel.updateOne({ _id: listenerId }, { $set: { queue: allSongs, lastUsedOptions: options } }, { upsert: true });
        }

        return {
            queue: songsResponse,
            songQueueId: songQueueIdToBePlayed,
            isMoreSongsForwardForLoading,
            isMoreSongsBehindForLoading,
        };
    }

    async _formatSongs(listenerId: string, songsData: Array<QueueSongType>,) {
        const songsResponse: Array<QueueSongInfoResponseDataType> = [];
        if (songsData?.length) {
            const songIds = songsData.map(song => song.songId);
            const songs = await SongModel.find({ _id: { $in: songIds } }).lean();
            for (const songData of songsData) {
                const songToBeFormated = songs.find(song => song._id === songData.songId);
                const songFormated: SongInfoResponseDataType = await songService.formatSongData(listenerId, songToBeFormated);
                songFormated.songUrl += `&token=${randomstring.generate(16)}`;
                songsResponse.push({ ...songFormated, songQueueId: songData.songQueueId });
            }
        }
        return songsResponse;
    }

    async _getSongIdsForQueue(allSongs: Array<QueueSongType>, songId: string, songQueueId: string, shuffleEnabled: boolean,
        repeatSongState: RepeatSongStatesType, isNewQueue: boolean, extendForward: boolean): Promise<{
            songs: Array<QueueSongType>,
            isMoreSongsForwardForLoading: boolean,
            isMoreSongsBehindForLoading: boolean
        }> {
        if (shuffleEnabled) {
            allSongs = this._shuffle(allSongs, songId);
        }
        let startIndex: number;
        let endIndex: number;
        let additionalStartIndex: number;
        let additionalEndIndex: number;
        let isMoreSongsForwardForLoading: boolean;
        let isMoreSongsBehindForLoading: boolean;
        if (isNewQueue && !songId && !songQueueId) {
            startIndex = 0;
            endIndex = 9;
            isMoreSongsBehindForLoading = false;
            isMoreSongsForwardForLoading = true;
        }
        if (isNewQueue) {
            const currentSongIndex = allSongs.findIndex(song => song.songId === songId);
            const lastPossibleStartIndex = 0;
            const lastPossibleEndIndex = allSongs.length - 1;
            startIndex = Math.max(currentSongIndex - 9, lastPossibleStartIndex);
            endIndex = Math.min(currentSongIndex + 9, lastPossibleEndIndex);
            isMoreSongsBehindForLoading = startIndex !== lastPossibleStartIndex;
            isMoreSongsForwardForLoading = endIndex !== lastPossibleEndIndex;
        } else {
            const currentSongIndex = allSongs.findIndex(song => song.songQueueId === songQueueId);
            if (extendForward) {
                const currentEndIndex = currentSongIndex + 9;
                if (repeatSongState === RepeatSongStateEnum.loop) {
                    const lastPossibleIndex = allSongs.length - 1;
                    startIndex = currentSongIndex + 1;
                    endIndex = Math.min(currentEndIndex, lastPossibleIndex);
                    if (currentEndIndex > lastPossibleIndex) {
                        additionalEndIndex = currentEndIndex - lastPossibleIndex;
                    }
                    isMoreSongsForwardForLoading = true;
                } else {
                    const lastPossibleIndex = allSongs.length - 1;
                    startIndex = currentSongIndex + 1;
                    endIndex = Math.min(currentEndIndex, lastPossibleIndex);
                    isMoreSongsForwardForLoading = endIndex !== lastPossibleIndex;
                }
            } else {
                const currentStartIndex = currentSongIndex - 9;
                if (repeatSongState === RepeatSongStateEnum.loop) {
                    const lastPossibleIndex = 0;
                    startIndex = Math.max(currentStartIndex, lastPossibleIndex);
                    endIndex = currentSongIndex - 1;
                    if (currentStartIndex < lastPossibleIndex) {
                        additionalStartIndex = allSongs.length - (lastPossibleIndex - currentStartIndex);
                    }
                    isMoreSongsBehindForLoading = true;
                } else {
                    const lastPossibleIndex = 0;
                    startIndex = Math.max(currentStartIndex, lastPossibleIndex);
                    endIndex = currentSongIndex - 1;
                    isMoreSongsBehindForLoading = startIndex !== lastPossibleIndex;
                }
            }
        }

        let songs: Array<QueueSongType> = allSongs.slice(startIndex, endIndex + 1);
        if (additionalStartIndex) {
            const additionalSongs = allSongs.slice(additionalStartIndex, allSongs.length - 1);
            songs = [...additionalSongs, ...songs];
        } else if (additionalEndIndex) {
            const additionalSongs = allSongs.slice(0, additionalEndIndex);
            songs = [...songs, ...additionalSongs];
        }

        return {
            songs,
            isMoreSongsForwardForLoading,
            isMoreSongsBehindForLoading
        }
    }

    _shuffle(songs: Array<QueueSongType>, songId: string): Array<QueueSongType> {
        const currentSongIndex = songs.findIndex(song => song.songId === songId);
        const firstSong = songs[currentSongIndex];
        songs.splice(currentSongIndex, 1);
        let currentIndex = songs.length;
        let randomIndex: number;

        while (currentIndex > 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [songs[currentIndex], songs[randomIndex]] = [songs[randomIndex], songs[currentIndex]];
        }

        return [firstSong, ...songs];
    }

}

const queueService = new QueueService();
export default queueService;