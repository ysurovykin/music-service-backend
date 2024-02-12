import { RepeatSongStateEnum } from "../models/listener.model";
import { SongInfoResponseDataType } from "../models/song.model";

export default class ListenerDto{
    volume: number;
    muted: boolean;
    shuffleEnabled: boolean;
    repeatSongState: RepeatSongStateEnum;
    songId: string;
    songsQueue: Array<SongInfoResponseDataType>;
    name: string;
    songIndex: number;
    playTime: number;

    constructor(model: any){
        this.name = model.name;
        this.volume = model.volume;
        this.muted = model.muted
        this.shuffleEnabled = model.shuffleEnabled;
        this.repeatSongState = model.repeatSongState;
        this.songId = model.songId;
        this.songsQueue = model.songsQueue;
        this.name = model.name;
        this.songIndex = model.songIndex;
        this.playTime = model.playTime;
    }
}