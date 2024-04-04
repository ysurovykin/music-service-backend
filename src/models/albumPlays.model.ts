import { Schema, model } from 'mongoose';

const AlbumPlaysModel = model('AlbumPlays', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  albumId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true },
  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
}));

export default AlbumPlaysModel;
