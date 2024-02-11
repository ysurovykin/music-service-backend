import { Schema, model } from 'mongoose';

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
    birthDate: Date;
    profileType: ProfileTypeEnum;
    profileImageLink: string;
};

const BirthDateSchema = new Schema({
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
});

const UserSchema = model('User', new Schema({
    _id: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: [BirthDateSchema],
    /**
     * @type {ProfileTypeEnum} profile type
     */
    profileType: { type: String, required: true },
    profileImageLink: { type: String, required: false },
}));

export default UserSchema;
