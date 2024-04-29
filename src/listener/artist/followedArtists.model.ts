import { Schema, model } from 'mongoose';

const followArtistsSchema = new Schema({
  _id: { type: String },
  listenerId: { type: String, required: true },
  artistId: { type: String, required: true },
  date: { type: Date, required: true }
});

followArtistsSchema.index({listenerId: 1})
followArtistsSchema.index({artistId: 1})
followArtistsSchema.index({listenerId: 1, artistId: 1})

const FollowedArtistsModel = model('FollowedArtists', followArtistsSchema);

export default FollowedArtistsModel;
