import {Schema, model} from 'mongoose';

export interface AlbumArtist {
    name: string,
    link: string
};

export type Album = {
  name: string;
  artist: AlbumArtist;
  languages: string;
  genres: Array<string>;
};

const AlbumSchema = model('Album', new Schema({
    name: { type: String, required: true },
    /**
     * @type {AlbumArtist} array of artist datas
     */
    artist: { type: Object, required: true },
    coverImageLink: { type: String, required: true },
    likes: { type: Number, default: 0, required: true },
    languages: { type: Array<String>, required: true },
    genres: { type: Array<String>, required: true },
    date: { type: Date, required: true },
}));

export default AlbumSchema;
