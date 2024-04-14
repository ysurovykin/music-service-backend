import { Schema, model } from 'mongoose';

const artistPlaysSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true },
  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
});

artistPlaysSchema.index({ listenerId: 1 });
artistPlaysSchema.index({ listenerId: 1, lastPlayedDate: 1});
artistPlaysSchema.index({ listenerId: 1, artistId: 1});

const ArtistPlaysModel = model('ArtistPlays', artistPlaysSchema);

export default ArtistPlaysModel;
