import { AlbumArtist } from "../models/album.model";

export default class AlbumDto{
    name: string;
    artist: AlbumArtist;
    coverImageLink: string;
    likes: number;
    languages: Array<string>;
    genres: Array<string>;
    date: Date;

    constructor(model: any){
        this.name = model.name;
        this.artist = model.artist;
        this.coverImageLink = model.coverImageLink;
        this.likes = model.likes;
        this.languages = model.languages;
        this.genres = model.genres;
        this.date = model.date;
    }
}