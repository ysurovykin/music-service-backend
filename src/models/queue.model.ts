import { Schema, model } from 'mongoose';
import { SongInfoResponseDataType } from './song.model';

export type QueueInfoResponseDataType = {
    queue: Array<SongInfoResponseDataType>;
    isMoreSongsForwardForLoading: boolean;
    isMoreSongsBehindForLoading: boolean;
}

export type GenerateQueueOptionsType = {
    albumId?: string;
    artistId?: string;
    playlistId?: string;
}

const QueueSchema = model('Queue', new Schema({
    _id: { type: String },
    listenerId: { type: String, required: true },
    queue: [String],
    isMoreSongsForwardForLoading: { type: Boolean, required: false },
    isMoreSongsBehindForLoading: { type: Boolean, required: false }
}));

export default QueueSchema;
