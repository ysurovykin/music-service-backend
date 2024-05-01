export default class ArtistProfileDto {
    artistProfileId: string;
    name: string;
    profileImageUrl: string;
    backgroundColor: string;
    subscription: string;

    constructor(model: any) {
        this.artistProfileId = model._id;
        this.name = model.name;
        this.profileImageUrl = model.profileImageUrl;
        this.backgroundColor = model.backgroundColor;
        this.subscription = model.subscription;
    }
}