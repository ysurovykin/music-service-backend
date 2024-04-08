import { Schema, model } from 'mongoose';
import { SongInfoResponseDataType } from './song.model';

export type QueueInfoResponseDataType = {
    queue: Array<QueueSongInfoResponseDataType>;
    songQueueId: string;
    isMoreSongsForwardForLoading: boolean;
    isMoreSongsBehindForLoading: boolean;
}

export type QueueSongInfoResponseDataType = SongInfoResponseDataType & {
    songQueueId: string;
}

export type GenerateQueueOptionsType = {
    albumId?: string;
    artistId?: string;
    playlistId?: string;
    listenerId?: string;
    songRadioBaseSongId?: string;
}

export type QueueSongType = {
    songId: string;
    songQueueId: string;
}

export type UpdatedQueueDataType = {
    queue: Array<QueueSongType>;
    lastUsedOptions?: GenerateQueueOptionsType;
}

export enum RepeatSongStateEnum {
    'none' = 'none',
    'loop' = 'loop',
    'one' = 'one'
}

export type RepeatSongStatesType = 'none' | 'loop' | 'one';

const QueueSongSchema = new Schema({
    songId: { type: String, required: true },
    songQueueId: { type: String, required: true }
});

const QueueModel = model('Queue', new Schema({
    _id: { type: String },
    listenerId: { type: String, required: true },
    queue: [QueueSongSchema],
    lastUsedOptions: { type: Object, required: false },
    isMoreSongsForwardForLoading: { type: Boolean, required: false },
    isMoreSongsBehindForLoading: { type: Boolean, required: false }
}));

export default QueueModel;
