import { Schema, model } from 'mongoose';

export type SongPlayRawDataType = {
  listenerId: string,
  songId: string,
  time: number,
  date: Date
}

const songPlayRawDataSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  songId: { type: String, required: true },
  time: { type: Number, required: true },
  date: { type: Date, required: true }
});

songPlayRawDataSchema.index({ listenerId: 1 });

const SongPlaysRawDataModel = model('SongPlaysRawData', songPlayRawDataSchema);

export default SongPlaysRawDataModel;
