import { ArtistSocialLinks } from "../models/artist.model";

export default class ArtistDto{
    artistId: string;
    name: string;
    country: string;
    description: string;
    socialLinks: Array<ArtistSocialLinks>;
    followers: number;

    constructor(model: any){
        this.artistId = model._id;
        this.name = model.name;
        this.country = model.country;
        this.description = model.description;
        this.socialLinks = model.socialLinks;
        this.followers = model.followers;
    }
}