import { Schema, model } from 'mongoose';
import { AlbumShortDataType } from './album.model';
import { ArtistShortDataType } from './artist.model';

export type CreateSongRequestDataType = {
    name: string;
    artistId: string;
    coArtistIds?: Array<string>;
    albumId: string;
    language: string;
    genres: Array<string>;
};

export type SongInfoResponseDataType = {
    name: string;
    artists: Array<ArtistShortDataType>;
    album: AlbumShortDataType;
    plays: number;
    date: Date;
    coverImageurl: string;
    songUrl: string;
}

const SongSchema = model('Song', new Schema({
    _id: { type: String },
    name: { type: String, required: true },
    artistId: { type: String, required: true },
    coArtistIds: { type: [String], required: true },
    albumId: { type: String, required: true },
    coverImageLink: { type: String, required: true },
    plays: { type: Number, default: 0, required: true },
    language: { type: String, required: true },
    genres: { type: [String], required: true },
    link: { type: String, required: true },
    date: { type: Date, required: true }
}));

export default SongSchema;
