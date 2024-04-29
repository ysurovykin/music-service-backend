import { ArtistSocialLinks } from "./artist.model";

export default class ArtistDto {
    artistId: string;
    name: string;
    country: string;
    description: string;
    socialLinks: Array<ArtistSocialLinks>;
    followers: number;
    monthlyListeners: number;
    profileImageUrl: string;
    backgroundColor: string;
    songsCount: number;

    constructor(model: any) {
        this.artistId = model._id;
        this.name = model.name;
        this.country = model.country;
        this.description = model.description;
        this.socialLinks = model.socialLinks;
        this.followers = model.followers;
        this.monthlyListeners = model.monthlyListeners;
        this.profileImageUrl = model.profileImageUrl;
        this.backgroundColor = model.backgroundColor;
        this.songsCount = model.songsCount;
    }
}