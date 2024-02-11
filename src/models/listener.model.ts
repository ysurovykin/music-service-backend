import { Schema, model } from 'mongoose';
import { SongInfoResponseDataSchema, SongInfoResponseDataType } from './song.model';

export type CreateListenerRequestDataType = {
  name: string;
};

export enum RepeatSongStateEnum {
  'none' = 'none',
  'loop' = 'loop',
  'one' = 'one'
}

export type ListenerInfoResponseDataType = {
  volume: number,
  shuffleEnabled: boolean,
  repeatSongState: RepeatSongStateEnum,
  songId: string,
  songsQueue: Array<SongInfoResponseDataType>,
  name: string;
}

export type ListenerSongDataToUpdateType = {
  songId: string,
  songsQueue: Array<SongInfoResponseDataType>
}

const ListenerSchema = model('Listener', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  volume: { type: Number, required: true, default: 30 },
  shuffleEnabled: { type: Boolean, require: true, default: false },
  /**
   * @type {RepeatSongStateEnum} repeat song state
   */
  repeatSongState: { type: String, required: true, default: 'none' },
  songId: { type: String, required: false },
  songsQueue: { type: [SongInfoResponseDataSchema], required: false},
  playTime: { type: Number, required: true, default: 0 },
  songIndex: { type: Number, required: false }
}));

export default ListenerSchema;
