import { Schema, model } from 'mongoose';

export type CreateAlbumRequestDataType = {
  name: string;
  artistId: String;
  languages: string;
  genres: Array<string>;
};

export type AlbumSongDataType = {
  name: string,
  plays: number,
  coArtistIds: Array<string>,
  downloadUrl: string
}

export type AlbumArtistDataType = {
  name: string,
  link: string
}

export type AlbumInfoResponseDataType = {
  albumId: string,
  name: string,
  date: Date,
  downloadUrl: string,
  artist: AlbumArtistDataType
}

export type AlbumFullResponseDataType = {
  name: string,
  date: Date,
  songs: Array<AlbumSongDataType>,
  downloadUrl: string,
  artist: AlbumArtistDataType
}

const AlbumSchema = model('Album', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  artistId: { type: String, required: true },
  coverImageLink: { type: String, required: true },
  likes: { type: Number, default: 0, required: true },
  languages: { type: [String], required: true },
  genres: { type: [String], required: true },
  date: { type: Date, required: true },
}));

export default AlbumSchema;
