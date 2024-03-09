import { Schema, model } from 'mongoose';

const LikedAlbumsSchema = model('LikedAlbums', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  albumId: { type: String, required: true },
  artistId: { type: String, required: true },
  date: { type: Date, required: true }
}));

export default LikedAlbumsSchema;
