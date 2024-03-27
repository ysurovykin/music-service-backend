import { Schema, model } from 'mongoose';

const LikedAlbumsModel = model('LikedAlbums', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  albumId: { type: String, required: true },
  artistId: { type: String, required: true },
  date: { type: Date, required: true }
}));

export default LikedAlbumsModel;
