import { Schema, model } from 'mongoose';
import { AlbumShortDataType } from '../album/album.model';
import { ArtistShortDataType } from '../artist/artist.model';

export type UploadSongRequestDataType = {
    name: string;
    artistId: string;
    coArtistIds?: Array<string>;
    albumId: string;
    language: string;
    genres: Array<string>;
    indexInAlbum: number;
    explicit: boolean;
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
    explicit: boolean;
    hidden?: boolean;
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
    hidden?: boolean;
    explicit: boolean;
}

export type GetSongsResponseDataType = {
    songs: Array<SongInfoResponseDataType>;
    isMoreSongsForLoading: Boolean;
}

export type GetSongsOptionsType = {
    albumId?: string;
    artistId?: string;
    playlistId?: string;
    songRadioBaseSongId?: string;
    listenerId?: string;
}

export type GetSongsSortingOptionsType = {
    name?: number,
    album?: number,
    plays?: number,
    duration?: number,
    date?: number
}

export type ArtistSongInfoResponseDataType = {
    songId: string;
    name: string;
    plays: number;
    duration: number;
    backgroundColor: string;
    coverImageUrl: string;
    hidden?: boolean;
    explicit?: boolean;
    coArtists?: Array<ArtistShortDataType>;
}

export type GetArtistSongsResponseDataType = {
    songs?: Array<ArtistSongInfoResponseDataType>;
}

const songSchema = new Schema({
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
    explicit: { type: Boolean, required: true },
    hidden: { type: Boolean, required: false },
    lyricsBackgroundShadow: { type: String, required: true }
});

songSchema.index({ albumId: 1, hidden: 1 });
songSchema.index({ artistId: 1, hidden: 1 });
songSchema.index({ name: 1, hidden: 1 });
songSchema.index({ hidden: 1, artistId: 1, genres: 1 });
songSchema.index({ _id: 1, hidden: 1, genres: 1, language: 1 });
songSchema.index({ _id: 1, hidden: 1, artistId: 1, genres: 1 });
songSchema.index({ _id: 1, hidden: 1, language: 1, genres: 1, artistId: 1, albumId: 1 })

const SongModel = model('Song', songSchema);

export default SongModel;
