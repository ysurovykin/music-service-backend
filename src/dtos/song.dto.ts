export default class SongDto{
    name: string;
    artistIds: Array<String>;
    albumId: String;
    coverImageLink: string;
    plays: number;
    language: string;
    genres: Array<string>;
    date: Date;

    constructor(model: any){
        this.name = model.name;
        this.artistIds = model.artistIds;
        this.albumId = model.albumId;
        this.coverImageLink = model.coverImageLink;
        this.plays = model.plays;
        this.language = model.language;
        this.genres = model.genres;
        this.date = model.date;
    }
}