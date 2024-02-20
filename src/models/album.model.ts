import { Schema, model } from 'mongoose';
import { ArtistShortDataType } from './artist.model';
import { SongInfoResponseDataType } from './song.model';

export type CreateAlbumRequestDataType = {
  name: string;
  artistId: string;
  languages: string;
  genres: Array<string>;
};

export type AlbumShortDataType = {
  name: string;
  id: string;
}

export const AlbumShortDataSchema = new Schema<AlbumShortDataType>({
  name: { type: String, required: true },
  id: { type: String, required: true },
});

export type AlbumInfoResponseDataType = {
  albumId: string;
  name: string;
  date: Date;
  coverImageUrl: string;
  backgroundColor: string;
  artist: ArtistShortDataType;
}

export type AlbumFullResponseDataType = AlbumInfoResponseDataType & {
  likes: number;
  songs: Array<SongInfoResponseDataType>;
}

const AlbumSchema = model('Album', new Schema({
  _id: { type: String },
  name: { type: String, required: true },
  artistId: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  likes: { type: Number, default: 0, required: true },
  languages: { type: [String], required: true },
  genres: { type: [String], required: true },
  date: { type: Date, required: true },
  backgroundColor: { type: String, required: false }
}));

export default AlbumSchema;
