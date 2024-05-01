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

const artistProfileSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false },
  subscription: { type: String, required: true },
});


const ArtistProfileModel = model('ArtistProfile', artistProfileSchema);

export default ArtistProfileModel;
