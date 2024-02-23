import { Schema, model } from 'mongoose';
import { AlbumWithoutArtistType } from './album.model';

export type ArtistSocialLinks = {
  name: string;
  link: string;
}

export type CreateArtistRequestDataType = {
  name: string;
  country: string;
  description?: string;
  socialLinks?: Array<ArtistSocialLinks>;
  followers: number;
  genres: Array<string>;
};

export type ArtistShortDataType = {
  name: string;
  id: string;
}

export type ArtistInfoResponseDataType = {
  artistId: string;
  name: string;
  country: string;
  description: string;
  socialLinks: Array<ArtistSocialLinks>;
  followers: number;
}

export type ArtistFullResponseDataType = ArtistInfoResponseDataType & {
  albums: Array<AlbumWithoutArtistType>;
}

const SocialLinksSchema = new Schema({
  name: { type: String, required: true },
  link: { type: String, required: true }
});

const ArtistSchema = model('Artist', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: false },
  socialLinks: [SocialLinksSchema],
  genres: [String],
  followers: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true },
  coverImageUrl: { type: String, required: false },
  profileImageUrl: { type: String, required: false },
  backgroundColor: { type: String, required: false }
}));

export default ArtistSchema;
