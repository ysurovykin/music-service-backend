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
    indexInAlbum: number;
};

export type SongInfoResponseDataType = {
    songId: string;
    name: string;
    artists: Array<ArtistShortDataType>;
    album: AlbumShortDataType;
    plays: number;
    date: Date;
    coverImageUrl: string;
    backgroundColor: string;
    lyricsBackgroundShadow: string;
    duration: number;
    songUrl: string;
    playlistIds: Array<string>;
}

export type SongRecordType = {
    _id: string;
    name: string;
    artistId: string;
    coArtistIds: Array<string>;
    albumId: string;
    coverImageUrl: string;
    backgroundColor: string;
    lyricsBackgroundShadow: string;
    plays: number;
    language: string;
    genres: Array<string>;
    songUrl: string;
    duration: number;
    date: Date;
}

export type GetSongsResponseDataType = {
    songs: Array<SongInfoResponseDataType>;
    isMoreSongsForLoading: Boolean;
}

export type GetSongsOptionsType = {
    albumId?: string;
    artistId?: string;
    playlistId?: string;
}

const SongSchema = model('Song', new Schema({
    _id: { type: String },
    name: { type: String, required: true },
    artistId: { type: String, required: true },
    coArtistIds: { type: [String], required: true },
    albumId: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    plays: { type: Number, default: 0, required: true },
    language: { type: String, required: true },
    genres: { type: [String], required: true },
    songUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
    backgroundColor: { type: String, required: true },
    lyricsBackgroundShadow: { type: String, required: true }
}));

export default SongSchema;
