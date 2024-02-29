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
}

export type QueueSongType = {
    songId: string;
    songQueueId: string;
}

export type UpdatedQueueDataType = {
    queue: Array<QueueSongType>;
    lastUsedOptions?: GenerateQueueOptionsType;
}

const QueueSongSchema = new Schema({
    songId: { type: String, required: true },
    songQueueId: { type: String, required: true }
});

const QueueSchema = model('Queue', new Schema({
    _id: { type: String },
    listenerId: { type: String, required: true },
    queue: [QueueSongSchema],
    lastUsedOptions: { type: Object, required: false },
    isMoreSongsForwardForLoading: { type: Boolean, required: false },
    isMoreSongsBehindForLoading: { type: Boolean, required: false }
}));

export default QueueSchema;
