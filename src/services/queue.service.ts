import QueueModel, { QueueInfoResponseDataType, GenerateQueueOptionsType } from '../models/queue.model';
import songService from './song.service';
import SongModel, { SongInfoResponseDataType, } from '../models/song.model';
import PlaylistModel from '../models/playlist.model';

class QueueService {

    async getQueue(listenerId: string, songId: string): Promise<QueueInfoResponseDataType> {
        const queue = await QueueModel.findOne({ listenerId: listenerId }).lean();
        const allSongIds = queue?.queue || [];
        let songsResponse: Array<SongInfoResponseDataType> = [];
        if (allSongIds.length) {
            const currentSongIndex = allSongIds.findIndex(id => id === songId);
            const startIndex = Math.max(currentSongIndex - 10, 0);
            const endIndex = Math.min(currentSongIndex + 20, allSongIds.length - 1);
            const songIds = allSongIds.slice(startIndex, endIndex);
            songsResponse = await this._formatSongs(listenerId, songIds);
        }
        return {
            queue: songsResponse,
            isMoreSongsForwardForLoading: queue?.isMoreSongsForwardForLoading || true,
            isMoreSongsBehindForLoading: queue?.isMoreSongsBehindForLoading || true
        };
    }

    async generateQueue(listenerId: string, songId: string, shuffleEnabled: boolean, isNewQueue: boolean, extendForward: boolean,
        options: GenerateQueueOptionsType): Promise<QueueInfoResponseDataType> {
        options = typeof options === 'object' ? options : JSON.parse(options);
        const currentQueue = await QueueModel.findOne({ listenerId: listenerId }).lean();
        let allSongIds: Array<string>;
        if (isNewQueue) {
            if (options.playlistId) {
                const playlistSongs = await PlaylistModel.findOne({ _id: options.playlistId }, { songIds: 1 }).lean();
                allSongIds = playlistSongs.songIds;
            } else {
                const allSongs = await SongModel.find({ ...options }, { _id: 1 }).lean();
                allSongIds = allSongs.map(song => song._id);
            }
        } else {
            allSongIds = currentQueue.queue;
        }
        const { songIds, isMoreSongsForwardForLoading, isMoreSongsBehindForLoading } = await this._getSongIdsForQueue(allSongIds,
            songId, shuffleEnabled, isNewQueue, extendForward, listenerId, currentQueue?.queue || []);
        let songsResponse: Array<SongInfoResponseDataType> = [];
        if (songIds.length) {
            songsResponse = await this._formatSongs(listenerId, songIds);
        }

        return {
            queue: songsResponse,
            isMoreSongsForwardForLoading,
            isMoreSongsBehindForLoading,
        };
    }

    async _formatSongs(listenerId: string, songIds: Array<string>,) {
        const songsResponse: Array<SongInfoResponseDataType> = [];
        if (songIds?.length) {
            const songs = await SongModel.find({ _id: { $in: songIds } }).lean();
            for (const song of songs) {
                const songFormated: SongInfoResponseDataType = await songService.formatSongData(listenerId, song);
                songsResponse.push(songFormated);
            }
        }
        return songsResponse;
    }

    async _getSongIdsForQueue(allSongIds: Array<string>, songId: string, shuffleEnabled: boolean,
        isNewQueue: boolean, extendForward: boolean, listenerId: string, currentQueue: Array<string>): Promise<{
            songIds: Array<string>,
            isMoreSongsForwardForLoading: boolean,
            isMoreSongsBehindForLoading: boolean
        }> {
        if (shuffleEnabled) {
            allSongIds = this._shuffle(allSongIds);
        }
        const currentSongIndex = allSongIds.findIndex(id => id === songId);
        let startIndex: number;
        let endIndex: number;
        let isMoreSongsForwardForLoading: boolean;
        let isMoreSongsBehindForLoading: boolean;
        if (isNewQueue) {
            const lastPossibleStartIndex = 0;
            const lastPossibleEndIndex = allSongIds.length - 1;
            startIndex = Math.max(currentSongIndex - 10, lastPossibleStartIndex);
            endIndex = Math.min(currentSongIndex + 20, lastPossibleEndIndex);
            isMoreSongsBehindForLoading = startIndex !== lastPossibleStartIndex;
            isMoreSongsForwardForLoading = endIndex !== lastPossibleEndIndex;
        } else {
            if (extendForward) {
                const lastPossibleIndex = allSongIds.length - 1;
                startIndex = currentSongIndex;
                endIndex = Math.min(currentSongIndex + 20, lastPossibleIndex);
                isMoreSongsForwardForLoading = endIndex !== lastPossibleIndex;
            } else {
                const lastPossibleIndex = 0;
                startIndex = Math.max(currentSongIndex - 10, lastPossibleIndex);
                endIndex = currentSongIndex;
                isMoreSongsBehindForLoading = startIndex !== lastPossibleIndex;
            }
        }

        const songIds = allSongIds.slice(startIndex, endIndex + 1);
        const updatedQueue = isNewQueue ? [...songIds] :
            extendForward ? [...currentQueue, ...songIds] :
                [...songIds, ...currentQueue];

        await QueueModel.updateOne({ _id: listenerId }, {
            $set: {
                queue: updatedQueue,
                isMoreSongsForwardForLoading,
                isMoreSongsBehindForLoading
            }
        }, { upsert: true });
        return {
            songIds,
            isMoreSongsForwardForLoading,
            isMoreSongsBehindForLoading
        }
    }

    _shuffle(songIds: Array<string>): Array<string> {
        let currentIndex = songIds.length;
        let randomIndex: number;

        while (currentIndex > 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [songIds[currentIndex], songIds[randomIndex]] = [songIds[randomIndex], songIds[currentIndex]];
        }

        return songIds;
    }

}

const queueService = new QueueService();
export default queueService;