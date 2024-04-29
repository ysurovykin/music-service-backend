import { Schema, model } from 'mongoose';

const likedAlbumsSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  albumId: { type: String, required: true },
  artistId: { type: String, required: true },
  date: { type: Date, required: true }
});

likedAlbumsSchema.index({ listenerId: 1 });

const LikedAlbumsModel = model('LikedAlbums', likedAlbumsSchema);

export default LikedAlbumsModel;
