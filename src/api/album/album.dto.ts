export default class AlbumDto {
    albumId: string;
    name: string;
    artistId: string;
    coverImageUrl: string;
    likes: number;
    date: Date;
    backgroundColor: string;
    lyricsBackgroundShadow: string;
    songsCount: number;
    hidden: boolean;

    constructor(model: any) {
        this.albumId = model._id;
        this.name = model.name;
        this.artistId = model.artistId;
        this.coverImageUrl = model.coverImageUrl;
        this.likes = model.likes;
        this.date = model.date;
        this.backgroundColor = model.backgroundColor;
        this.lyricsBackgroundShadow = model.lyricsBackgroundShadow;
        this.songsCount = model.songsCount;
        this.hidden = model.hidden;
    }
}