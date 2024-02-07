import { Schema, model } from 'mongoose';
import { AlbumShortDataType } from './album.model';
import { ArtistShortDataType } from './artist.model';
import { Double } from 'mongodb';

export type CreateSongRequestDataType = {
    name: string;
    artistId: string;
    coArtistIds?: Array<string>;
    albumId: string;
    language: string;
    genres: Array<string>;
};

export type SongInfoResponseDataType = {
    songId: string;
    name: string;
    artists: Array<ArtistShortDataType>;
    album: AlbumShortDataType;
    plays: number;
    date: Date;
    coverImageUrl: string;
    duration: number;
    songUrl: string;
}

export type SongRecordType = {
    _id: string,
    name: string,
    artistId: string,
    coArtistIds: Array<string>,
    albumId: string,
    coverImageLink: string,
    plays: number,
    language: string,
    genres: Array<string>,
    link: string,
    duration: number,
    date: Date,
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
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
}));

export default SongSchema;
