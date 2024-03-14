import { Schema, model } from 'mongoose';

const FollowedArtistsModel = model('FollowedArtists', new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  date: { type: Date, required: true }
}));

export default FollowedArtistsModel;
