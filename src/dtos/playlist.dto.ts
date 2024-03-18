import { PlaylistTagEnum } from "../models/playlist.model";
import { SongInfoResponseDataType } from "../models/song.model";

export default class PlaylistDto {
    playlistId: string;
    name: string;
    date: Date;
    coverImageUrl: string;
    tag: PlaylistTagEnum;
    songs: Array<SongInfoResponseDataType>;
    backgroundColor: string;
    description: string;
    editable: boolean;
    pinned: boolean;

    constructor(model: any) {
        this.playlistId = model._id;
        this.name = model.name;
        this.date = model.date;
        this.coverImageUrl = model.coverImageUrl;
        this.tag = model.tag as PlaylistTagEnum;
        this.songs = model.songs;
        this.backgroundColor = model.backgroundColor;
        this.description = model.description;
        this.editable = model.editable;
        this.pinned = model.pinned;
    }
}