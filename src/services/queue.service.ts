import QueueModel, { QueueInfoResponseDataType, GenerateQueueOptionsType, QueueSongInfoResponseDataType, QueueSongType, UpdatedQueueDataType } from '../models/queue.model';
import songService from './song.service';
import SongModel, { SongInfoResponseDataType, } from '../models/song.model';
import PlaylistModel from '../models/playlist.model';
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

    async generateQueue(listenerId: string, songId: string, songQueueId: string, shuffleEnabled: boolean, isNewQueue: boolean,
        extendForward: boolean, options: GenerateQueueOptionsType): Promise<QueueInfoResponseDataType> {
        const currentQueue = await QueueModel.findOne({ _id: listenerId }).lean();
        if (options) {
            options = typeof options === 'object' ? options : JSON.parse(options);
        } else {
            options = currentQueue.lastUsedOptions;
        }
        let allSongs: Array<QueueSongType>;
        if (isNewQueue) {
            if (options.playlistId) {
                const playlistSongs = await PlaylistModel.findOne({ _id: options.playlistId }, { songIds: 1 }).lean();
                allSongs = playlistSongs.songIds.map(id => ({ songId: id, songQueueId: randomstring.generate(16) }));
            } else {
                const songs = await SongModel.find({ ...options }, { _id: 1 }).lean();
                allSongs = songs.map(song => ({ songId: song._id, songQueueId: randomstring.generate(16) }));
            }
        } else {
            allSongs = currentQueue.queue;
        }
        const { songs, isMoreSongsForwardForLoading, isMoreSongsBehindForLoading } = await this._getSongIdsForQueue(allSongs,
            songId, songQueueId, shuffleEnabled, isNewQueue, extendForward);
        const songsResponse = await this._formatSongs(listenerId, songs);
        if (isNewQueue) {
            await QueueModel.updateOne({ _id: listenerId }, { $set: { queue: allSongs, lastUsedOptions: options } }, { upsert: true });
        }
        let songQueueIdToBePlayed: string;
        if (isNewQueue && !songQueueId && !songId) {
            songQueueIdToBePlayed = songs[0].songQueueId;
        } else if (isNewQueue && !songQueueId) {
            songQueueIdToBePlayed = songs.find(song => song.songId === songId).songQueueId;
        } else {
            songQueueIdToBePlayed = songQueueId;
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
        isNewQueue: boolean, extendForward: boolean): Promise<{
            songs: Array<QueueSongType>,
            isMoreSongsForwardForLoading: boolean,
            isMoreSongsBehindForLoading: boolean
        }> {
        if (shuffleEnabled) {
            allSongs = this._shuffle(allSongs, songId);
        }
        let startIndex: number;
        let endIndex: number;
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
                const lastPossibleIndex = allSongs.length - 1;
                startIndex = currentSongIndex + 1;
                endIndex = Math.min(currentSongIndex + 9, lastPossibleIndex);
                isMoreSongsForwardForLoading = endIndex !== lastPossibleIndex;
            } else {
                const lastPossibleIndex = 0;
                startIndex = Math.max(currentSongIndex - 9, lastPossibleIndex);
                endIndex = currentSongIndex - 1;
                isMoreSongsBehindForLoading = startIndex !== lastPossibleIndex;
            }
        }

        const songs = allSongs.slice(startIndex, endIndex + 1);

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