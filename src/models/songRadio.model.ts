import { Schema, model } from 'mongoose';

export type SongRadioInfoResponseDataType = {
  name: string,
  lastUpdatedAt: Date,
  coverImageUrl: string,
  songName: string,
  backgroundColor: string,
  baseSongId: string
}

export type SongRadioFullResponseDataType = SongRadioInfoResponseDataType & {
  status: 204,
  songsTimeDuration: number,
  songsCount: number
}

export type ApproveRequestResponseDataType = {
  status: 300,
  approveRefresh: boolean
}

export type GetListenerSongRadiosResponseDataType = {
  listenerSongRadios: Array<SongRadioInfoResponseDataType>;
  isMoreListenerSongRadiosForLoading: boolean;
}

export type SongRadioRecordType = {
  _id: string;
  listenerId: string
  name: string
  baseSongId: string
  lastUpdatedAt: Date
  songIds: Array<string>,
}

const SongRadioModel = model('SongRadio', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  name: { type: String, required: true },
  baseSongName: { type: String, required: true },
  baseSongId: { type: String, required: true },
  lastUpdatedAt: { type: Date, required: true },
  songIds: [String],
}));

export default SongRadioModel;
