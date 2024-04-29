import { Schema, model } from 'mongoose';

const albumPlaysSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  albumId: { type: String, required: true },
  lastPlayedDate: { type: Date, required: true },
  // plays: {'yyyy/MM': number}
  plays: { type: Object, required: true }
});

albumPlaysSchema.index({ listenerId: 1 });
albumPlaysSchema.index({ listenerId: 1, lastPlayedDate: 1 })
albumPlaysSchema.index({ listenerId: 1, artistId: 1, albumId: 1 })

const AlbumPlaysModel = model('AlbumPlays', albumPlaysSchema);

export default AlbumPlaysModel;
