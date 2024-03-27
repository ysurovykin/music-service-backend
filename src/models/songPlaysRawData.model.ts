import { Schema, model } from 'mongoose';

export type SongPlayRawDataType = {
  listenerId: string,
  songId: string,
  time: number,
  date: Date
}

const SongPlaysRawDataModel = model('SongPlaysRawData', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  songId: { type: String, required: true },
  time: { type: Number, required: true },
  date: { type: Date, required: true }
}));

export default SongPlaysRawDataModel;
