import { Schema, model } from 'mongoose';

const SongPlaysModel = model('SongPlays', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  songId: { type: String, required: true },

  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
}));

export default SongPlaysModel;
