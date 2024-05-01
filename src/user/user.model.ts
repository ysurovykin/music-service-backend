import { Schema, model } from 'mongoose';
import { CardDetailsType } from './creditCards/creditCards.model';

export type BirthDate = {
    day: Number;
    month: Number;
    year: Number;
};

export enum ProfileTypeEnum {
    'listener' = 'listener',
    'artist' = 'artist',
    'admin' = 'admin'
}

export type CreateUserRequestDataType = {
    email: string;
    password: string;
    name: string;
    gender: string;
    country: string;
    birthDate: BirthDate;
    profileType: ProfileTypeEnum;
    profileImageLink: string;
};

export type ChangeSubscriptionRequestDataType = {
    subscription: string;
    cardId?: string; //if cardDetails is undefined
    cardDetails?: CardDetailsType; //if cardId is undefined
}

const BirthDateSchema = new Schema({
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
});

const userSchema = new Schema({
    _id: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: BirthDateSchema,
    /**
     * @type {ProfileTypeEnum} profile type
     */
    profileType: { type: String, required: true },
    hasListenerProfile: { type: Boolean, required: false },
    hasArtistProfile: { type: Boolean, required: false }
})

userSchema.index({ email: 1 });

const UserModel = model('User', userSchema);

export default UserModel;
