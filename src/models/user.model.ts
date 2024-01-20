import {Schema, model} from 'mongoose';

export interface BirthDate {
    day: Number,
    month: Number,
    year: Number
};

export type User = {
    email: string;
    password: string;
    name: string;
    gender: string;
    country: string;
    birthDate: Date;
    role: 'user' | 'artist' | 'admin';
    profileImageLink: string;
};

export interface ArtistSocialLinks {
  name: string,
  link: string
}

export type Artist = {
  name: string;
  country: string;
  description?: string;
  socialLinks?: Array<ArtistSocialLinks>;
  genres: Array<string>;
};

type ArtistData = {
    description: string,
    socialLinks: Array<ArtistSocialLinks>,
    genres: Array<string>,
    followers: number
}

const UserSchema = model('User', new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    country: { type: String, required: true },
    /**
     * @type {BirthDate} birth date
     */
    birthDate: { type: Object, required: true },
    /**
     * @type {('user' | 'artist' | 'admin')} user role
     */
    role: { type: String, required: true },
    profileImageLink: {type: String, required: false},
    /**
     * @type {ArtistData} artist data
     */
    artistData: { type: Object, required: false }
}));

export default UserSchema;
