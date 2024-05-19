import { Schema, model } from 'mongoose';

export type ArtistProfileInfoResponseDataType = {
  artistProfileId: string;
  name: string;
  profileImageUrl: string;
  backgroundColor: string;
  subscription: string;
  subscriptionCanceledAtDate: string;
}

export type EditProfileRequestDataType = {
  name: string;
}

export type ArtistGeneralStatsType = {
  followers?: number;
  listeners?: number;
  songsCount?: number;
  songsDuration?: number;
  likes?: number;
}

export type ArtistAdvancedStatsType = {
  plays?: number;
  playsDynamics?: string;
  songRadios?: number;
  songGuessers?: number;
}

export type ArtistStatsResponseDataType = {
  generalStats: ArtistGeneralStatsType;
  advancedStats?: ArtistAdvancedStatsType;
}

const artistProfileSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false },
  subscription: { type: String, required: true },
  generalStats: { type: Object, required: false },
  advancedStats: { type: Object, required: false },
  artistProfileStatsUpdatedAt: { type: Date, required: false },
  artistAlbumsStatsUpdatedAt: { type: Date, required: false }
});


const ArtistProfileModel = model('ArtistProfile', artistProfileSchema);

export default ArtistProfileModel;
