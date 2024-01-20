import { SongAlbum, SongArtist } from "../models/song.model";

export default class SongDto{
    name: string;
    artists: Array<SongArtist>;
    album: SongAlbum;
    coverImageLink: string;
    plays: number;
    language: string;
    genres: Array<string>;
    date: Date;

    constructor(model: any){
        this.name = model.name;
        this.artists = model.artists;
        this.album = model.album;
        this.coverImageLink = model.coverImageLink;
        this.plays = model.plays;
        this.language = model.language;
        this.genres = model.genres;
        this.date = model.date;
    }
}