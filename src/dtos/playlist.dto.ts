import { SongInfoResponseDataType } from "../models/song.model";

export default class PlaylistDto {
    playlistId: string;
    name: string;
    date: Date;
    coverImageUrl: string;
    songs: Array<SongInfoResponseDataType>;

    constructor(model: any) {
        this.playlistId = model._id;
        this.name = model.name;
        this.date = model.date;
        this.coverImageUrl = model.coverImageUrl;
        this.songs = model.songs;
    }
}