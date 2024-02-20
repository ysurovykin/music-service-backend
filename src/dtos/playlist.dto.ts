import { SongInfoResponseDataType } from "../models/song.model";

export default class PlaylistDto {
    playlistId: string;
    name: string;
    date: Date;
    coverImageUrl: string;
    tag: string;
    songs: Array<SongInfoResponseDataType>;
    backgroundColor: string;

    constructor(model: any) {
        this.playlistId = model._id;
        this.name = model.name;
        this.date = model.date;
        this.coverImageUrl = model.coverImageUrl;
        this.tag = model.tag;
        this.songs = model.songs;
        this.backgroundColor = model.backgroundColor;
    }
}