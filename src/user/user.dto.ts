import { BirthDate, ProfileTypeEnum } from "./user.model";

export default class UserDto {
    userId: string;
    email: string;
    name: string;
    gender: string;
    country: string;
    profileType: ProfileTypeEnum;
    birthDate: BirthDate;
    hasArtistProfile: boolean;
    hasListenerProfile: boolean;

    constructor(model: any) {
        this.userId = model._id || model.userId;
        this.email = model.email;
        this.name = model.name;
        this.gender = model.gender;
        this.country = model.country;
        this.profileType = model.profileType;
        this.birthDate = model.birthDate;
        this.hasArtistProfile = model.hasArtistProfile;
        this.hasListenerProfile = model.hasListenerProfile;
    }
}