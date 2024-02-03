export default class AlbumDto{
    name: string;
    artistId: String;
    downloadUrl: string;
    likes: number;
    date: Date;

    constructor(model: any){
        this.name = model.name;
        this.artistId = model.artistId;
        this.downloadUrl = model.coverImageLink;
        this.likes = model.likes;
        this.date = model.date;
    }
}