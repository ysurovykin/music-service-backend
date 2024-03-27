import { Schema, model } from 'mongoose';

const ArtistPlaysModel = model('ArtistPlays', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true }
}));

export default ArtistPlaysModel;
