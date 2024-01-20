import {Schema, model} from 'mongoose';

export interface SongArtist {
    name: string,
    link: string
};

export interface SongAlbum {
    name: string,
    link: string
};

export type Song = {
    name: string;
    artist: string;
    coArtists?: Array<string>;
    albumName: string;
    language: string;
    genres: Array<string>;
};

const SongSchema = model('Song', new Schema({
    name: { type: String, required: true },
    /**
     * @type {SongArtist} array of artist datas
     */
    artist: { type: Object, required: true },
    coArtists: { type: Array<SongArtist>, required: false },
    /**
     * @type {SongAlbum} array of artist datas
     */
    album: { type: Object, required: true },
    coverImageLink: { type: String, required: true },
    plays: { type: Number, default: 0, required: true },
    language: { type: String, required: true },
    genres: { type: Array<String>, required: true },
    link: { type: String, required: true },
    date: { type: Date, required: true }
}));

export default SongSchema;
