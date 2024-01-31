import { Schema, model } from 'mongoose';

export type Song = {
    name: string;
    artistId: string;
    coArtistIds?: Array<string>;
    albumId: string;
    language: string;
    genres: Array<string>;
};

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
