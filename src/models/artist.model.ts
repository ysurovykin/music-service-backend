import { Schema, model } from 'mongoose';

export interface ArtistSocialLinks {
  name: string,
  link: string
}

export type CreateAlbumRequestDataType = {
  name: string;
  country: string;
  description?: string;
  socialLinks?: Array<ArtistSocialLinks>;
  followers: number;
  genres: Array<string>;
};

const SocialLinksSchema = new Schema({
  name: { type: String, required: true },
  link: { type: String, required: true }
});

const ArtistSchema = model('Artist', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: false },
  socialLinks: [SocialLinksSchema],
  genres: { type: [String], required: true },
  followers: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true },
}));

export default ArtistSchema;
