export default class SongDto{
    name: string;
    plays: number;
    date: Date;

    constructor(model: any){
        this.name = model.name;
        this.plays = model.plays;
        this.date = model.date;
    }
}