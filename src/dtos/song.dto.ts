export default class SongDto {
    songId: string;
    name: string;
    duration: number;
    plays: number;
    date: Date;
    backgroundColor: string;

    constructor(model: any) {
        this.songId = model._id;
        this.name = model.name;
        this.duration = model.duration;
        this.plays = model.plays;
        this.date = model.date;
        this.backgroundColor = model.backgroundColor;
    }
}