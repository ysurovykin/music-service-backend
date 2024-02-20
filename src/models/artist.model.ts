import { Schema, model } from 'mongoose';

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

export type ArtistAlbumDataType = {
  albumId: string;
  name: string;
  likes: number;
  date: Date;
  coverImageUrl: string;
  backgroundColor: string;
}

export type ArtistShortDataType = {
  name: string;
  id: string;
}

export const ArtistShortDataSchema = new Schema<ArtistShortDataType>({
  name: { type: String, required: true },
  id: { type: String, required: true },
});

export type ArtistInfoResponseDataType = {
  artistId: string;
  name: string;
  country: string;
  description: string;
  socialLinks: Array<ArtistSocialLinks>;
  followers: number;
}

export type ArtistFullResponseDataType = ArtistInfoResponseDataType & {
  albums: Array<ArtistAlbumDataType>;
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
