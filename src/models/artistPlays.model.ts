import { Schema, model } from 'mongoose';

const ArtistPlaysModel = model('ArtistPlays', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true },
  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
}));

export default ArtistPlaysModel;
