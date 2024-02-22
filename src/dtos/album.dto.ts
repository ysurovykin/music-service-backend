export default class AlbumDto {
    name: string;
    artistId: string;
    coverImageUrl: string;
    likes: number;
    date: Date;
    backgroundColor: string;
    lyricsBackgroundShadow: string;

    constructor(model: any) {
        this.name = model.name;
        this.artistId = model.artistId;
        this.coverImageUrl = model.coverImageUrl;
        this.likes = model.likes;
        this.date = model.date;
        this.backgroundColor = model.backgroundColor;
        this.lyricsBackgroundShadow = model.lyricsBackgroundShadow;
    }
}