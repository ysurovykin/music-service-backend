import { Schema, model } from 'mongoose';

export type SongPlaysType = {
  time: number
};

const SongPlaysModel = model('SongPlays', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  songId: { type: String, required: true },

  // plays: {'MM/yyyy': SongPlaysType}
  plays: { type: Object, required: true }
}));

export default SongPlaysModel;
